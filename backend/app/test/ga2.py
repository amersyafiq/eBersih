from collections import Counter
from datetime import datetime
from enum import Enum
import random as rnd
import statistics
import time

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import oauth2
from ..config import database
from ..service import ga_service
from ..service.ga_service import Assignment


router = APIRouter(
    prefix="/ga",
    tags=['Genetic Algorithm Schedule']
)

POPULATION_SIZE = 100
NUMB_OF_ELITE_SCHEDULES = 1
TOURNAMENT_SELECTION_SIZE = 7
CROSSOVER_RATE = 0.8
MUTATION_RATE = 0.1
MAX_GENERATIONS = 500
MAX_SECONDS = 30
CONVERGENCE_THRESHOLD = 20

W_HARD = 1000
W_BALANCE = 1.0
W_TRAVEL = 8.0

LS_RATE = 0.5
LS_MAX_ITERS = 300
LS_MAX_STALE = 80

GREEDY_SEED_RATIO = 0.2

RESTART_PATIENCE = 15
MAX_FAILED_RESTARTS = 4
RESTART_PERTURB_RATIO = 0.4
RESTART_GREEDY_RATIO = 0.3
RESTART_MUTATION_BASE = 0.15
RESTART_MUTATION_STEP = 0.05
RESTART_MUTATION_MAX = 0.5

DEBUG_PLOTS = False


class Violation:
    class ViolationType(Enum):
        UNASSIGNED_TASK = 1
        CATEGORY_MISMATCH = 2
        SHIFT_OVERLOAD = 3

    def __init__(self, violation_type, details):
        self._violation_type = violation_type
        self._details = details

    def get_violation_type(self): return self._violation_type
    def get_details(self): return self._details
    def __str__(self): return str(self._violation_type) + " " + str(self._details)


class Schedule:
    def __init__(self, dbMgr):
        self._dbMgr = dbMgr
        self._assignments = []
        self._violations = []
        self._fitness = float("inf")
        self._isFitnessChanged = True

    def get_assignments(self):
        self._isFitnessChanged = True
        return self._assignments

    def get_violations(self):
        self.get_fitness()
        return self._violations

    def get_fitness(self):
        if self._isFitnessChanged:
            self._fitness = self.calculate_fitness()
            self._isFitnessChanged = False
        return self._fitness

    def clone(self):
        cloned = Schedule(self._dbMgr)
        for assignment in self._assignments:
            new_assignment = Assignment(assignment.get_spacetaskgroup())
            new_assignment.set_cleaner(assignment.get_cleaner())
            cloned._assignments.append(new_assignment)
        return cloned

    def _build_blank_assignments(self):
        self._assignments = [
            Assignment(group)
            for group in self._dbMgr.get_spacetaskgroups()
        ]
        self._isFitnessChanged = True
        return self

    def initialize(self, greedy=False):
        self._build_blank_assignments()

        cleaners = self._dbMgr.get_cleaners()
        workload = {c.get_user_id(): 0.0 for c in cleaners}
        daily_load = {c.get_user_id(): 0.0 for c in cleaners}
        by_category = {}

        for cleaner in cleaners:
            category = (cleaner.get_category() or "").strip()
            by_category.setdefault(category, []).append(cleaner)

        assignments = self._assignments[:]
        if not greedy:
            rnd.shuffle(assignments)

        for assignment in assignments:
            group = assignment.get_spacetaskgroup()
            category = (group.get_category() or "").strip()
            eligible = by_category.get(category, [])

            if not eligible:
                continue

            if greedy:
                cleaner = min(
                    eligible,
                    key=lambda c: (
                        workload[c.get_user_id()],
                        daily_load[c.get_user_id()]
                    )
                )
            else:
                cleaner = rnd.choice(eligible)

            assignment.set_cleaner(cleaner)
            workload[cleaner.get_user_id()] += group.get_balance_weight()
            daily_load[cleaner.get_user_id()] += group.get_daily_minutes()

        self._isFitnessChanged = True
        return self

    def calculate_fitness(self):
        self._violations = []

        cleaners = self._dbMgr.get_cleaners()
        capacity = self._dbMgr.get_daily_capacity_minutes()

        balance_load = {c.get_user_id(): 0.0 for c in cleaners}
        daily_load = {c.get_user_id(): 0.0 for c in cleaners}
        floors_touched = {c.get_user_id(): set() for c in cleaners}

        for assignment in self._assignments:
            group = assignment.get_spacetaskgroup()
            cleaner = assignment.get_cleaner()

            if cleaner is None:
                self._violations.append(
                    Violation(Violation.ViolationType.UNASSIGNED_TASK, assignment)
                )
                continue

            required_category = (group.get_category() or "").strip()
            cleaner_category = (cleaner.get_category() or "").strip()

            if cleaner_category != required_category:
                self._violations.append(
                    Violation(Violation.ViolationType.CATEGORY_MISMATCH, assignment)
                )
                continue

            cleaner_id = cleaner.get_user_id()
            balance_load[cleaner_id] += group.get_balance_weight()
            daily_load[cleaner_id] += group.get_daily_minutes()
            floors_touched[cleaner_id].add(group.get_space().get_floor_id())

        for cleaner in cleaners:
            cleaner_id = cleaner.get_user_id()
            excess = daily_load[cleaner_id] - capacity

            if excess > 0:
                self._violations.append(
                    Violation(
                        Violation.ViolationType.SHIFT_OVERLOAD,
                        (cleaner, excess)
                    )
                )

        balance_term = 0.0
        categories = {
            (cleaner.get_category() or "").strip()
            for cleaner in cleaners
        }

        for category in categories:
            loads = [
                balance_load[c.get_user_id()]
                for c in cleaners
                if (c.get_category() or "").strip() == category
            ]

            if len(loads) > 1:
                balance_term += statistics.pstdev(loads)

        hard_penalty = 0.0

        for violation in self._violations:
            violation_type = violation.get_violation_type()

            if violation_type in (
                Violation.ViolationType.UNASSIGNED_TASK,
                Violation.ViolationType.CATEGORY_MISMATCH
            ):
                hard_penalty += 1
            elif violation_type == Violation.ViolationType.SHIFT_OVERLOAD:
                _, excess = violation.get_details()
                hard_penalty += excess / 60.0

        travel_term = sum(
            max(0, len(floors) - 1)
            for floors in floors_touched.values()
        )

        return (
            W_BALANCE * balance_term
            + W_HARD * hard_penalty
            + W_TRAVEL * travel_term
        )


class Population:
    def __init__(self, size, dbMgr, initialize=True):
        self._dbMgr = dbMgr
        self._schedules = []

        if initialize:
            greedy_count = int(size * GREEDY_SEED_RATIO)

            for i in range(size):
                self._schedules.append(
                    Schedule(dbMgr).initialize(greedy=i < greedy_count)
                )

    def get_schedules(self):
        return self._schedules


class GeneticAlgorithm:
    def __init__(self, dbMgr):
        self._dbMgr = dbMgr
        self._mutation_rate = MUTATION_RATE

    def evolve(self, population, deadline, use_local_search=True):
        new_population = self._crossover_population(population)

        self._mutate_population(new_population)

        if use_local_search:
            for i in range(
                NUMB_OF_ELITE_SCHEDULES,
                len(new_population.get_schedules())
            ):
                if time.monotonic() >= deadline:
                    break

                if rnd.random() < LS_RATE:
                    new_population.get_schedules()[i] = self.local_search(
                        new_population.get_schedules()[i],
                        deadline
                    )

        return new_population

    def _crossover_population(self, population):
        schedules = sorted(
            population.get_schedules(),
            key=lambda s: s.get_fitness()
        )

        new_population = Population(0, self._dbMgr, initialize=False)

        for schedule in schedules[:NUMB_OF_ELITE_SCHEDULES]:
            new_population.get_schedules().append(schedule.clone())

        while len(new_population.get_schedules()) < POPULATION_SIZE:
            parent1 = self._select_tournament_population(schedules)
            parent2 = self._select_tournament_population(schedules)

            if rnd.random() < CROSSOVER_RATE:
                child = self._crossover_schedule(parent1, parent2)
            else:
                child = parent1.clone()

            new_population.get_schedules().append(child)

        return new_population

    def _mutate_population(self, population):
        schedules = population.get_schedules()

        for i in range(NUMB_OF_ELITE_SCHEDULES, len(schedules)):
            self._mutate_schedule(schedules[i])

        return population

    @staticmethod
    def _crossover_schedule(schedule1, schedule2):
        child = Schedule(schedule1._dbMgr)._build_blank_assignments()

        for i, assignment in enumerate(child._assignments):
            source = (
                schedule1._assignments[i]
                if rnd.random() < 0.5
                else schedule2._assignments[i]
            )
            assignment.set_cleaner(source.get_cleaner())

        child._isFitnessChanged = True
        return child

    def _mutate_schedule(self, schedule):
        by_category = {}

        for cleaner in self._dbMgr.get_cleaners():
            category = (cleaner.get_category() or "").strip()
            by_category.setdefault(category, []).append(cleaner)

        for assignment in schedule._assignments:
            if rnd.random() >= self._mutation_rate:
                continue

            group = assignment.get_spacetaskgroup()
            category = (group.get_category() or "").strip()
            eligible = by_category.get(category, [])

            if eligible:
                assignment.set_cleaner(rnd.choice(eligible))

        schedule._isFitnessChanged = True
        return schedule

    def local_search(self, schedule, deadline):
        current = schedule.clone()
        current_fitness = current.get_fitness()
        stale = 0
        iterations = 0

        by_category = {}

        for cleaner in self._dbMgr.get_cleaners():
            category = (cleaner.get_category() or "").strip()
            by_category.setdefault(category, []).append(cleaner)

        while (
            iterations < LS_MAX_ITERS
            and stale < LS_MAX_STALE
            and time.monotonic() < deadline
        ):
            iterations += 1

            if not current._assignments:
                break

            assignment = rnd.choice(current._assignments)
            group = assignment.get_spacetaskgroup()
            category = (group.get_category() or "").strip()
            eligible = by_category.get(category, [])

            if len(eligible) < 2:
                stale += 1
                continue

            old_cleaner = assignment.get_cleaner()
            alternatives = [
                cleaner for cleaner in eligible
                if cleaner.get_user_id() != (
                    old_cleaner.get_user_id() if old_cleaner else None
                )
            ]

            if not alternatives:
                stale += 1
                continue

            candidate = current.clone()
            candidate_assignment = candidate._assignments[
                current._assignments.index(assignment)
            ]
            candidate_assignment.set_cleaner(rnd.choice(alternatives))
            candidate._isFitnessChanged = True

            candidate_fitness = candidate.get_fitness()

            if candidate_fitness < current_fitness:
                current = candidate
                current_fitness = candidate_fitness
                stale = 0
            else:
                stale += 1

        return current

    @staticmethod
    def _select_tournament_population(schedules):
        contenders = rnd.sample(
            schedules,
            min(TOURNAMENT_SELECTION_SIZE, len(schedules))
        )
        return min(contenders, key=lambda s: s.get_fitness())

    def restart(self, population, best_schedule, mutation_rate):
        schedules = sorted(
            population.get_schedules(),
            key=lambda s: s.get_fitness()
        )

        new_population = Population(0, self._dbMgr, initialize=False)
        new_population.get_schedules().append(best_schedule.clone())

        perturb_count = int(
            (POPULATION_SIZE - 1) * RESTART_PERTURB_RATIO
        )

        for i in range(1, POPULATION_SIZE):
            if i <= perturb_count:
                candidate = best_schedule.clone()
                self._mutate_schedule_with_rate(candidate, mutation_rate)
                new_population.get_schedules().append(candidate)
            else:
                greedy = rnd.random() < RESTART_GREEDY_RATIO
                new_population.get_schedules().append(
                    Schedule(self._dbMgr).initialize(greedy=greedy)
                )

        self._mutation_rate = mutation_rate
        return new_population

    def _mutate_schedule_with_rate(self, schedule, mutation_rate):
        previous_rate = self._mutation_rate
        self._mutation_rate = mutation_rate
        self._mutate_schedule(schedule)
        self._mutation_rate = previous_rate
        return schedule


def find_fittest_schedule(
    dbMgr,
    use_local_search=True,
    use_restart=True
):
    started = time.monotonic()
    deadline = started + MAX_SECONDS

    population = Population(POPULATION_SIZE, dbMgr)
    ga = GeneticAlgorithm(dbMgr)

    best = min(
        population.get_schedules(),
        key=lambda s: s.get_fitness()
    ).clone()

    best_fitness = best.get_fitness()
    since_improvement = 0
    generations = 0
    failed_restarts = 0
    restart_mutation_rate = RESTART_MUTATION_BASE
    fitness_history = [best_fitness]

    DisplayMgr.display_violations_count(best)

    while (
        generations < MAX_GENERATIONS
        and since_improvement < CONVERGENCE_THRESHOLD
        and time.monotonic() < deadline
    ):
        population = ga.evolve(
            population,
            deadline,
            use_local_search=use_local_search
        )
        generations += 1

        current = min(
            population.get_schedules(),
            key=lambda s: s.get_fitness()
        )

        if current.get_fitness() < best_fitness:
            best = current.clone()
            best_fitness = best.get_fitness()
            since_improvement = 0
            failed_restarts = 0
            restart_mutation_rate = RESTART_MUTATION_BASE
        else:
            since_improvement += 1

        if (
            use_restart
            and since_improvement >= RESTART_PATIENCE
            and time.monotonic() < deadline
        ):
            if failed_restarts >= MAX_FAILED_RESTARTS:
                break

            restart_mutation_rate = min(
                RESTART_MUTATION_MAX,
                restart_mutation_rate + RESTART_MUTATION_STEP
            )

            population = ga.restart(
                population,
                best,
                restart_mutation_rate
            )

            failed_restarts += 1
            since_improvement = 0

        fitness_history.append(best_fitness)

    DisplayMgr.display_violations_count(best)
    return best, generations, fitness_history


class DisplayMgr:
    @staticmethod
    def display_violations_count(best):
        print(Counter(
            v.get_violation_type()
            for v in best.get_violations()
        ))

    @staticmethod
    def capacity_report(dbMgr):
        limit = dbMgr.get_daily_capacity_minutes()
        report = {}

        for category in sorted({
            (group.get_category() or "").strip()
            for group in dbMgr.get_spacetaskgroups()
        }):
            groups = [
                group for group in dbMgr.get_spacetaskgroups()
                if (group.get_category() or "").strip() == category
            ]

            cleaners = dbMgr.get_cleaners_by_category(category)
            demand = sum(group.get_daily_minutes() for group in groups)
            capacity = len(cleaners) * limit

            report[category] = {
                "DailyDemand": demand,
                "Cleaners": len(cleaners),
                "DailyCapacity": capacity,
                "Ratio": round(demand / capacity, 2) if capacity else None,
            }

        return report

    @staticmethod
    def plot_convergence(fitness_history):
        import matplotlib.pyplot as plt

        plt.figure(figsize=(10, 6))
        plt.plot(range(len(fitness_history)), fitness_history)
        plt.xlabel("Generation Number")
        plt.ylabel("Fitness Value")
        plt.title("ARMA Fitness Convergence")
        plt.grid(True)
        plt.tight_layout()
        plt.show()

    @staticmethod
    def plot_workload_balance(schedule, dbMgr):
        import matplotlib.pyplot as plt

        workload = {
            cleaner.get_user_id(): 0.0
            for cleaner in dbMgr.get_cleaners()
        }

        for assignment in schedule._assignments:
            cleaner = assignment.get_cleaner()

            if cleaner is not None:
                group = assignment.get_spacetaskgroup()
                workload[cleaner.get_user_id()] += group.get_balance_weight()

        cleaners = dbMgr.get_cleaners()
        names = [c.get_fullname() for c in cleaners]
        loads = [workload[c.get_user_id()] for c in cleaners]

        plt.figure(figsize=(10, 6))
        plt.bar(names, loads)
        plt.xlabel("Cleaner")
        plt.ylabel("Total Workload Weight (minutes)")
        plt.title("Workload Distribution of ARMA-Generated Schedule")
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.show()


@router.post("/run", status_code=status.HTTP_201_CREATED)
def generate_schedule(
    zone_id: int,
    schedule_date: datetime,
    use_local_search: bool = True,
    use_restart: bool = True,
    db: Session = Depends(database.get_db),
    api_key: str = Depends(oauth2.require_system_key)
):
    triggered_at = datetime.now()
    dbMgr = ga_service.DBMgr(db, zone_id, schedule_date)

    capacity = DisplayMgr.capacity_report(dbMgr)

    best_schedule, generations, fitness_history = find_fittest_schedule(
        dbMgr,
        use_local_search=use_local_search,
        use_restart=use_restart
    )

    completed_at = datetime.now()

    if DEBUG_PLOTS:
        DisplayMgr.plot_convergence(fitness_history)
        DisplayMgr.plot_workload_balance(best_schedule, dbMgr)

    cleaners = {}
    unassigned = []

    for assignment in best_schedule._assignments:
        group = assignment.get_spacetaskgroup()
        space = group.get_space()
        cleaner = assignment.get_cleaner()

        if cleaner is None:
            unassigned.append({
                "SpaceCode": space.get_space_code(),
                "Category": group.get_category(),
                "DailyMinutes": group.get_daily_minutes(),
            })
            continue

        cleaner_id = cleaner.get_user_id()
        entry = cleaners.setdefault(cleaner_id, {
            "CleanerID": cleaner_id,
            "FullName": cleaner.get_fullname(),
            "Category": cleaner.get_category(),
            "TotalDailyMinutes": 0.0,
            "TotalWorkloadWeight": 0.0,
            "AssignedFloors": set(),
            "AssignedGroups": [],
        })

        entry["TotalDailyMinutes"] += group.get_daily_minutes()
        entry["TotalWorkloadWeight"] += group.get_balance_weight()
        entry["AssignedFloors"].add(space.get_floor_id())
        entry["AssignedGroups"].append({
            "SpaceCode": space.get_space_code(),
            "Category": group.get_category(),
            "DailyMinutes": group.get_daily_minutes(),
            "PeriodicLoad": group.get_periodic_load(),
        })

    for entry in cleaners.values():
        entry["AssignedFloors"] = sorted(
            floor for floor in entry["AssignedFloors"]
            if floor is not None
        )

    return {
        "Success": "true",
        "TriggeredAt": triggered_at,
        "CompletedAt": completed_at,
        "Generations": generations,
        "Fitness": best_schedule.get_fitness(),
        "Violations": len(best_schedule.get_violations()),
        "Capacity": capacity,
        "UnassignedTasks": unassigned,
        "Cleaners": list(cleaners.values()),
    }