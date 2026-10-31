from datetime import datetime
from enum import Enum
import math
import random as rnd
from collections import Counter

import matplotlib.pyplot as plt
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import oauth2, models
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
CONVERGENCE_THRESHOLD = 20       # Used when use_restart=False

# --- Adaptive Restart Parameters ---
RESTART_PATIENCE = 15            # Generations without improvement before triggering restart
MAX_FAILED_RESTARTS = 5          # Stop if this many consecutive restarts fail to find a new global best
RESTART_PERTURB_RATIO = 0.4      # 40% perturbed from best schedule, 60% fresh random schedules
RESTART_MUTATION_BASE = 0.15     # Initial perturbation mutation rate on restart
RESTART_MUTATION_STEP = 0.05     # Increase perturbation strength on consecutive restarts
RESTART_MUTATION_MAX = 0.50      # Max perturbation mutation rate

W_HARD = 1000       # per violation / per excess hour
W_BALANCE = 1.0     # per minute of std-dev inside each category
W_TRAVEL = 8.0      # per extra floor a cleaner must visit (~8 min of walking/transfer)

DEBUG_PLOTS = True  # Enabled so the live progressive plot displays during execution
CATEGORIES = ('Pekerja Am', 'Operator Mesin')


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
        self._fitness = -1
        self._isFitnessChanged = True

    def get_assignments(self):
        # caller may modify assignments, so invalidate cached fitness
        self._isFitnessChanged = True
        return self._assignments

    def get_violations(self):
        self.get_fitness()  # make sure violations are up to date
        return self._violations

    def get_fitness(self):
        if self._isFitnessChanged:
            self._fitness = self.calculate_fitness()
            self._isFitnessChanged = False
        return self._fitness

    # FIX 3: deep-enough copy so population members never share objects
    def clone(self):
        c = Schedule(self._dbMgr)
        for a in self._assignments:
            n = Assignment(a.get_space(), a.get_task(), a.get_estimated_duration())
            n.set_cleaner(a.get_cleaner())
            c._assignments.append(n)
        c._fitness = self._fitness
        c._isFitnessChanged = self._isFitnessChanged
        return c

    def _build_blank_assignments(self):
        spacetasks = self._dbMgr.get_spacetasks()
        self._assignments = [
            Assignment(st.get_space(), st.get_task(), st.get_estimated_duration())
            for st in spacetasks
        ]
        self._isFitnessChanged = True
        return self

    def initialize(self):
        self._build_blank_assignments()
        by_cat = {c: self._dbMgr.get_cleaners_by_category(c) for c in CATEGORIES}
        for assignment in self._assignments:
            req = (assignment.get_task().get_required_category() or '').strip()
            if by_cat.get(req):
                assignment.set_cleaner(rnd.choice(by_cat[req]))
            # else left unassigned -> HC_1 violation
        return self

    def calculate_fitness(self):
        self._violations = []
        cleaners = self._dbMgr.get_cleaners()
        limit = self._dbMgr.get_max_shift_minutes()          # FIX 2: single source of truth

        workload = {c.get_user_id(): 0.0 for c in cleaners}
        floors_touched = {c.get_user_id(): set() for c in cleaners}

        # HC_1, HC_2
        for a in self._assignments:
            cleaner = a.get_cleaner()
            task = a.get_task()
            duration = a.get_estimated_duration() or 0

            if cleaner is None:
                self._violations.append(Violation(Violation.ViolationType.UNASSIGNED_TASK, a))
                continue
            if (cleaner.get_category() or '').strip() != (task.get_required_category() or '').strip():
                self._violations.append(Violation(Violation.ViolationType.CATEGORY_MISMATCH, a))

            workload[cleaner.get_user_id()] += duration
            floors_touched[cleaner.get_user_id()].add(a.get_space().get_floor_id())

        # HC_4
        for c in cleaners:
            total = workload[c.get_user_id()]
            if total > limit:
                self._violations.append(
                    Violation(Violation.ViolationType.SHIFT_OVERLOAD, (c, total - limit))
                )

        # SC_1
        balance_term = 0.0
        for cat in CATEGORIES:
            durs = [workload[c.get_user_id()] for c in cleaners if c.get_category() == cat]
            if len(durs) > 1:
                mean = sum(durs) / len(durs)
                balance_term += math.sqrt(sum((d - mean) ** 2 for d in durs) / len(durs))

        # hard penalty
        hard_penalty = 0.0
        for v in self._violations:
            t = v.get_violation_type()
            if t in (Violation.ViolationType.UNASSIGNED_TASK, Violation.ViolationType.CATEGORY_MISMATCH):
                hard_penalty += 1
            elif t == Violation.ViolationType.SHIFT_OVERLOAD:
                _, excess = v.get_details()
                hard_penalty += excess / 60.0

        # SC_2 travel: extra floors per cleaner
        travel_term = sum(max(0, len(f) - 1) for f in floors_touched.values())

        return W_BALANCE * balance_term + W_HARD * hard_penalty + W_TRAVEL * travel_term


class Population:
    def __init__(self, size, dbMgr):
        self._dbMgr = dbMgr
        self._schedules = [Schedule(dbMgr).initialize() for _ in range(size)]

    def get_schedules(self): return self._schedules


class GeneticAlgorithm:
    def __init__(self, dbMgr):
        self._dbMgr = dbMgr

    def evolve(self, pop):
        return self._mutate_population(self._crossover_population(pop))

    def _crossover_population(self, pop):
        schedules = sorted(pop.get_schedules(), key=lambda s: s.get_fitness())
        new_pop = Population(0, self._dbMgr)

        for i in range(NUMB_OF_ELITE_SCHEDULES):
            new_pop.get_schedules().append(schedules[i].clone())

        while len(new_pop.get_schedules()) < POPULATION_SIZE:
            p1 = self._select_tournament_population(schedules)
            p2 = self._select_tournament_population(schedules)
            if rnd.random() < CROSSOVER_RATE:
                child = self._crossover_schedule(p1, p2)
            else:
                child = p1.clone()
            new_pop.get_schedules().append(child)
        return new_pop

    def _mutate_population(self, pop):
        for i in range(NUMB_OF_ELITE_SCHEDULES, len(pop.get_schedules())):
            self._mutate_schedule(pop.get_schedules()[i], MUTATION_RATE)
        return pop

    @staticmethod
    def _crossover_schedule(s1, s2):
        child = Schedule(s1._dbMgr)._build_blank_assignments()
        a1, a2 = s1._assignments, s2._assignments
        for i, assignment in enumerate(child._assignments):
            source = a1[i] if rnd.random() > 0.5 else a2[i]
            assignment.set_cleaner(source.get_cleaner())
        return child

    @staticmethod
    def _mutate_schedule(sched, rate=MUTATION_RATE):
        dbMgr = sched._dbMgr
        by_cat = {c: dbMgr.get_cleaners_by_category(c) for c in CATEGORIES}
        for a in sched.get_assignments():
            if rnd.random() > rate:
                continue
            req = (a.get_task().get_required_category() or '').strip()
            if by_cat.get(req):
                a.set_cleaner(rnd.choice(by_cat[req]))
        return sched

    @staticmethod
    def _select_tournament_population(schedules):
        contenders = rnd.sample(schedules, min(TOURNAMENT_SELECTION_SIZE, len(schedules)))
        return min(contenders, key=lambda s: s.get_fitness())

    def restart(self, best_schedule, restart_mutation_rate):
        new_pop = Population(0, self._dbMgr)
        new_pop.get_schedules().append(best_schedule.clone())

        perturb_count = int((POPULATION_SIZE - 1) * RESTART_PERTURB_RATIO)

        for i in range(1, POPULATION_SIZE):
            if i <= perturb_count:
                candidate = best_schedule.clone()
                self._mutate_schedule(candidate, rate=restart_mutation_rate)
                new_pop.get_schedules().append(candidate)
            else:
                new_pop.get_schedules().append(Schedule(self._dbMgr).initialize())

        return new_pop


def find_fittest_schedule(dbMgr, use_restart=True):
    population = Population(POPULATION_SIZE, dbMgr)
    ga = GeneticAlgorithm(dbMgr)

    best = min(population.get_schedules(), key=lambda s: s.get_fitness()).clone()
    best_fitness = best.get_fitness()
    global_best_archive = [best.clone()]

    since_improvement = 0
    generation = 0
    failed_restarts = 0
    restart_mutation_rate = RESTART_MUTATION_BASE
    fitness_history = [best_fitness]

    # Initialize Live Progressive Plot
    live_fig, live_ax, live_line = (None, None, None)
    if DEBUG_PLOTS:
        live_fig, live_ax, live_line = DisplayMgr.init_live_convergence_plot(best_fitness)

    DisplayMgr.display_violations_count(best)

    while (
        generation < MAX_GENERATIONS
        and (use_restart or since_improvement < CONVERGENCE_THRESHOLD)
    ):
        population = ga.evolve(population)
        generation += 1

        current = min(population.get_schedules(), key=lambda s: s.get_fitness())
        current_fitness = current.get_fitness()

        # Check for meaningful improvement (avoids 1e-15 floating-point noise resetting counter)
        if current_fitness < best_fitness - 1e-6:
            best = current.clone()
            best_fitness = best.get_fitness()
            global_best_archive.append(best.clone())
            since_improvement = 0
            failed_restarts = 0
            restart_mutation_rate = RESTART_MUTATION_BASE
        else:
            since_improvement += 1

        fitness_history.append(best_fitness)

        # Adaptive Restart Trigger
        restarted_this_gen = False
        if use_restart and since_improvement >= RESTART_PATIENCE:
            if failed_restarts >= MAX_FAILED_RESTARTS:
                print(
                    f"Stopping at Generation {generation}: "
                    f"Reached MAX_FAILED_RESTARTS ({MAX_FAILED_RESTARTS})."
                )
                break

            restart_mutation_rate = min(
                RESTART_MUTATION_MAX,
                restart_mutation_rate + RESTART_MUTATION_STEP
            )

            print(
                f"🔄 [ADAPTIVE RESTART #{failed_restarts + 1}] at Gen {generation} "
                f"(Stale for {since_improvement} gens | Perturb Rate: {restart_mutation_rate:.2f})"
            )

            population = ga.restart(best, restart_mutation_rate)
            failed_restarts += 1
            since_improvement = 0
            restarted_this_gen = True

        print(
            f"Generation: {generation} | Best Fitness: {best_fitness:.4f} | "
            f"Gen Best: {current_fitness:.4f} | Stale: {since_improvement}/{RESTART_PATIENCE}"
        )

        # Update Live Progressive Plot on every generation
        if DEBUG_PLOTS and live_fig is not None:
            DisplayMgr.update_live_convergence_plot(
                live_fig,
                live_ax,
                live_line,
                fitness_history,
                restarted_gen=generation if restarted_this_gen else None
            )

    if DEBUG_PLOTS and live_fig is not None:
        DisplayMgr.finalize_live_plot()

    overall_best = min(global_best_archive, key=lambda s: s.get_fitness())
    DisplayMgr.display_violations_count(overall_best)
    return overall_best, generation, fitness_history


class DisplayMgr:
    @staticmethod
    def display_violations_count(best):
        print(Counter(v.get_violation_type() for v in best.get_violations()))

    @staticmethod
    def capacity_report(dbMgr):
        limit = dbMgr.get_max_shift_minutes()
        report = {}
        for cat in CATEGORIES:
            demand = sum(
                st.get_estimated_duration() for st in dbMgr.get_spacetasks()
                if (st.get_task().get_required_category() or '').strip() == cat
            )
            n = len(dbMgr.get_cleaners_by_category(cat))
            cap = n * limit
            report[cat] = {
                "Demand": demand, "Cleaners": n, "Capacity": cap,
                "Ratio": round(demand / cap, 2) if cap else None,
            }
        return report

    @staticmethod
    def init_live_convergence_plot(initial_fitness):
        plt.ion()  # Turn on interactive mode for live generation-by-generation plotting
        fig, ax = plt.subplots(figsize=(10, 6))
        (line,) = ax.plot(
            [0],
            [initial_fitness],
            color="tab:blue",
            linewidth=2,
            label="Best Fitness"
        )
        ax.set_xlabel("Generation Number")
        ax.set_ylabel("Fitness Value")
        ax.set_title("GA with Adaptive Restart — Live Fitness Convergence")
        ax.grid(True)
        ax.legend(loc="upper right")
        fig.tight_layout()
        fig.canvas.draw()
        fig.canvas.flush_events()
        plt.pause(0.01)
        return fig, ax, line

    @staticmethod
    def update_live_convergence_plot(fig, ax, line, fitness_history, restarted_gen=None):
        x_data = list(range(len(fitness_history)))
        line.set_xdata(x_data)
        line.set_ydata(fitness_history)

        if restarted_gen is not None:
            existing_labels = [l.get_label() for l in ax.lines]
            ax.axvline(
                x=restarted_gen,
                color="tab:red",
                linestyle="--",
                alpha=0.7,
                label="Adaptive Restart" if "Adaptive Restart" not in existing_labels else "_nolegend_"
            )
            ax.legend(loc="upper right")

        ax.relim()
        ax.autoscale_view()
        fig.canvas.draw()
        fig.canvas.flush_events()
        plt.pause(0.01)

    @staticmethod
    def finalize_live_plot():
        plt.ioff()

    @staticmethod
    def plot_workload_balance(schedule, dbMgr):
        workload = {c.get_user_id(): 0 for c in dbMgr.get_cleaners()}
        for a in schedule.get_assignments():
            if a.get_cleaner() is not None:                     # None-safe
                workload[a.get_cleaner().get_user_id()] += a.get_estimated_duration()
        names = [c.get_fullname() for c in dbMgr.get_cleaners()]
        durs = [workload[c.get_user_id()] for c in dbMgr.get_cleaners()]
        plt.figure(figsize=(10, 6))
        plt.bar(names, durs)
        plt.xlabel("Cleaner"); plt.ylabel("Total Assigned Duration (minutes)")
        plt.title("Workload Distribution of GA-Generated Schedule")
        plt.xticks(rotation=45, ha="right"); plt.tight_layout()
        plt.show()


@router.post("/run", status_code=status.HTTP_201_CREATED)
def generate_schedule(
    zone_id: int,
    schedule_date: datetime,
    use_restart: bool = True,
    db: Session = Depends(database.get_db),
    api_key: str = Depends(oauth2.require_system_key)
):
    triggeredAt = datetime.now()
    dbMgr = ga_service.DBMgr(db, zone_id, schedule_date)

    capacity = DisplayMgr.capacity_report(dbMgr)
    print("Capacity report:", capacity)

    best_schedule, generations, fitness_history = find_fittest_schedule(
        dbMgr,
        use_restart=use_restart
    )
    completedAt = datetime.now()

    if DEBUG_PLOTS:
        DisplayMgr.plot_workload_balance(best_schedule, dbMgr)

    cleaners = {}
    unassigned = []
    for a in best_schedule.get_assignments():
        c = a.get_cleaner()
        if c is None:
            unassigned.append(str(a))
            continue
        entry = cleaners.setdefault(c.get_user_id(), {
            "CleanerID": c.get_user_id(),
            "FullName": c.get_fullname(),
            "Category": c.get_category(),
            "TotalAssignedDuration": 0,
            "AssignedFloors": set(),
            "AssignedTasks": [],
        })
        entry["TotalAssignedDuration"] += a.get_estimated_duration()
        entry["AssignedFloors"].add(a.get_space().get_floor_id())
        entry["AssignedTasks"].append(str(a))

    for entry in cleaners.values():
        entry["AssignedFloors"] = sorted(entry["AssignedFloors"])

    return {
        "Success": "true",
        "Time": datetime.now(),
        "Generations": generations,
        "Fitness": best_schedule.get_fitness(),
        "Violations": len(best_schedule.get_violations()),
        "Capacity": capacity,
        "UnassignedTasks": unassigned,
        "Cleaners": list(cleaners.values()),
    }
