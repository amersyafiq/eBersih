from datetime import datetime
from enum import Enum
import random as rnd
import matplotlib.pyplot as plt

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import oauth2, models
from ..config import database
from ..service import ga_service
from ..service.ga_service import Assignment
from collections import Counter



router = APIRouter(
    prefix="/ga",
    tags=['Genetic Algorithm Schedule']
)

POPULATION_SIZE = 100           # Number of schedules in each population
NUMB_OF_ELITE_SCHEDULES = 1     # Number of top schedules carried unchanged to next generation
TOURNAMENT_SELECTION_SIZE = 7   # Size of the tournament selection pool
CROSSOVER_RATE = 0.8            # Probability a pair produces a crossover child (vs. a clone)
MUTATION_RATE = 0.25             # Probability of a swap mutation in a schedule
MAX_GENERATIONS = 500             # Hard cap on generations
CONVERGENCE_THRESHOLD = 20       # Stop early if no improvement for this many generations
W_HARD = 10000                  # Hard constraint violation weight
W_TRAVEL = 0.1                  # Travel penalty weight

# HC_1 Unique task assignment 
# HC_2 Staff category matching category (Pekerja Am / Operator Mesin).  
# HC_3 Staff Attendance 
# HC_4 Working hour limit 8 hours on weekdays and 5 hours on Saturdays. 
# HC_5 Time window  
# HC_6 Restricted room

# SC_1 Workload Balance
# SC_2 Travel Minimization

class Violation:
    class ViolationType(Enum):
        UNASSIGNED_TASK = 1     # HC_1: no eligible cleaner of the required category existed
        CATEGORY_MISMATCH = 2   # HC_2: cleaner's category doesn't match Task.RequiredCategory
        SHIFT_OVERLOAD = 3      # HC_4: cleaner's total assigned duration exceeds MAX_SHIFT_MINUTES
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
        self._isFitnessChanged = True
        return self._assignments

    def get_violations(self): return self._violations

    def get_fitness(self):
        if self._isFitnessChanged:
            self._fitness = self.calculate_fitness()
            self._isFitnessChanged = False
        return self._fitness

    def _build_blank_assignments(self):
        spacetasks = self._dbMgr.get_spacetasks()
        self._assignments = [
            Assignment(spacetask.get_space(), spacetask.get_task(), spacetask.get_estimated_duration())
            for spacetask in spacetasks
        ]
        return self

    def initialize(self):
        self._build_blank_assignments()
        pekerja_am = self._dbMgr.get_cleaners_by_category('Pekerja Am')
        operator_mesin = self._dbMgr.get_cleaners_by_category('Operator Mesin')
        for assignment in self._assignments:
            required_category = assignment.get_task().get_required_category()
            if required_category == 'Pekerja Am' and pekerja_am:
                assignment.set_cleaner(rnd.choice(pekerja_am))
            elif required_category == 'Operator Mesin' and operator_mesin:
                assignment.set_cleaner(rnd.choice(operator_mesin))
            # else left unassigned -> HC_1 violation in fitness
        return self

    def calculate_fitness(self):
        self._violations = []
        assignments = self._assignments
        cleaners = self._dbMgr.get_cleaners()

        workload = {c.get_user_id(): 0.0 for c in cleaners}
        floors_touched = {c.get_user_id(): set() for c in cleaners}

        # Check for HC_1 and HC_2
        for a in assignments:
            cleaner = a.get_cleaner()
            task = a.get_task()
            duration = a.get_estimated_duration() or 0

            if cleaner is None: 
                self._violations.append(Violation(Violation.ViolationType.UNASSIGNED_TASK, a))
                continue
            if cleaner.get_category() != task.get_required_category(): self._violations.append(Violation(Violation.ViolationType.CATEGORY_MISMATCH, a))

            workload[cleaner.get_user_id()] += duration
            floors_touched[cleaner.get_user_id()].add(a.get_space().get_floor_id())

        # Check for HC_4
        min_shift = 4800 if self._dbMgr.get_schedule_date().weekday() == 6 else 3000
        for c in cleaners:
            total = workload[cleaner.get_user_id()]
            if total > min_shift:
                self._violations.append(Violation(Violation.ViolationType.SHIFT_OVERLOAD, (cleaner, total - min_shift)))

        # variance term: (1/n) * sum((Di - mean)^2)
        n = len(cleaners)
        if n == 0:
            variance_term = 0.0
        else:
            durations = list(workload.values())
            mean = sum(durations) / n
            variance_term = sum((d - mean) ** 2 for d in durations) / n

        # hard constraint penalty: W_hard * sum(V(hc_k))
        hard_penalty = 0.0
        for v in self._violations:
            if v.get_violation_type() in (Violation.ViolationType.UNASSIGNED_TASK, Violation.ViolationType.CATEGORY_MISMATCH):
                hard_penalty += 1
            elif v.get_violation_type() == Violation.ViolationType.SHIFT_OVERLOAD:
                _, excess_minutes = v.get_details()
                hard_penalty += excess_minutes / 60.0

        # travel penalty: W_travel * sum(T(ci))
        # cleaner beyond the first as a stand-in for travel between spaces
        travel_term = sum(max(0, len(floors) - 1) for floors in floors_touched.values())

        return variance_term + (W_HARD * hard_penalty) + (W_TRAVEL * travel_term)


class Population:
    def __init__(self, size, dbMgr):
        self._dbMgr = dbMgr
        self._schedules = []

        for i in range(0, size):
            self._schedules.append(Schedule(dbMgr).initialize())

    def get_schedules(self): return self._schedules


class GeneticAlgorithm:
    def __init__(self, dbMgr):
        self._dbMgr = dbMgr

    def evolve(self, pop):
        return self._mutate_population(self._crossover_population(pop))

    def _crossover_population(self, pop):
        schedules = sorted(pop.get_schedules(), key=lambda s: s.get_fitness())  # ascending: best first
        crossover_pop = Population(0, self._dbMgr)

        for i in range(NUMB_OF_ELITE_SCHEDULES):
            crossover_pop.get_schedules().append(schedules[i])

        i = NUMB_OF_ELITE_SCHEDULES
        while i < POPULATION_SIZE:
            parent1 = self._select_tournament_population(schedules)
            parent2 = self._select_tournament_population(schedules)
            child = self._crossover_schedule(parent1, parent2) if rnd.random() < CROSSOVER_RATE else parent1
            crossover_pop.get_schedules().append(child)
            i += 1
        return crossover_pop

    def _mutate_population(self, pop):
        for i in range(NUMB_OF_ELITE_SCHEDULES, POPULATION_SIZE):
            self._mutate_schedule(pop.get_schedules()[i])
        return pop

    @staticmethod
    def _crossover_schedule(schedule1, schedule2):
        child = Schedule(schedule1._dbMgr)._build_blank_assignments()
        s1, s2 = schedule1._assignments, schedule2._assignments 
        for i, assignment in enumerate(child._assignments):
            source = s1[i] if rnd.random() > 0.5 else s2[i]
            assignment.set_cleaner(source.get_cleaner())
        return child

    @staticmethod
    def _mutate_schedule(mutateSchedule):
        dbMgr = mutateSchedule._dbMgr
        pekerja_am = dbMgr.get_cleaners_by_category('Pekerja Am')
        operator_mesin = dbMgr.get_cleaners_by_category('Operator Mesin')

        for assignment in mutateSchedule.get_assignments():
            if rnd.random() > MUTATION_RATE: continue
            required_category = assignment.get_task().get_required_category().strip()
            if required_category == 'Pekerja Am' and pekerja_am:
                assignment.set_cleaner(rnd.choice(pekerja_am))
            elif required_category == 'Operator Mesin' and operator_mesin:
                assignment.set_cleaner(rnd.choice(operator_mesin))
        return mutateSchedule

    @staticmethod
    def _select_tournament_population(schedules):
        contenders = rnd.sample(schedules, min(TOURNAMENT_SELECTION_SIZE, len(schedules)))
        return min(contenders, key=lambda s: s.get_fitness())  # lowest fitness wins


def find_fittest_schedule(dbMgr):
    population = Population(POPULATION_SIZE, dbMgr)
    ga = GeneticAlgorithm(dbMgr)

    best = min(population.get_schedules(), key=lambda s: s.get_fitness())
    best_fitness = best.get_fitness()
    generationsSinceImprovement = 0
    generationNumber = 0

    fitness_history = [best_fitness]
    DisplayMgr.display_violations_count(best)

    while generationNumber < MAX_GENERATIONS and generationsSinceImprovement < CONVERGENCE_THRESHOLD:
        population = ga.evolve(population)
        generationNumber += 1

        current_best = min(population.get_schedules(), key=lambda s: s.get_fitness())
        fitness_score = current_best.get_fitness()
        if fitness_score < best_fitness:
            best, best_fitness = current_best, current_best.get_fitness()
            generationsSinceImprovement = 0
        else:
            generationsSinceImprovement += 1

        fitness_history.append(best_fitness)
        print(generationNumber, '(', str(fitness_score), ')')

    DisplayMgr.display_violations_count(best)
    return best, generationNumber, fitness_history

class DisplayMgr:
    @staticmethod
    def display_violations_count(best):
        counts = Counter(v.get_violation_type() for v in best.get_violations())
        print(counts)
    @staticmethod
    def display_task_minutes(dbMgr):
        spacetasks = dbMgr.get_spacetasks()
        total_demand = sum(st.get_estimated_duration() for st in spacetasks)
        total_capacity = len(dbMgr.get_cleaners()) * 480
    
        print(f"Total task-minutes today: {total_demand}")
        print(f"Total cleaner-minutes available: {total_capacity}")
        print(f"Ratio: {total_demand / total_capacity:.2f}")
    @staticmethod
    def plot_convergence(fitness_history):
        plt.figure(figsize=(10, 6))
        plt.plot(range(len(fitness_history)), fitness_history)
        plt.xlabel("Generation Number")
        plt.ylabel("Fitness Value")
        plt.title("GA Fitness Convergence")
        plt.grid(True)
        plt.tight_layout()
        plt.show()
    @staticmethod
    def plot_workload_balance(schedule, dbMgr):
        workload = {}

        for cleaner in dbMgr.get_cleaners():
            workload[cleaner.get_user_id()] = 0

        for assignment in schedule.get_assignments():
            cleaner_id = assignment.get_cleaner().get_user_id()
            workload[cleaner_id] += assignment.get_estimated_duration()

        names = []
        durations = []

        for cleaner in dbMgr.get_cleaners():
            names.append(cleaner.get_fullname())
            durations.append(workload[cleaner.get_user_id()])

        plt.figure(figsize=(10, 6))
        plt.bar(names, durations)
        plt.xlabel("Cleaner")
        plt.ylabel("Total Assigned Duration (minutes)")
        plt.title("Workload Distribution of GA-Generated Schedule")
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.show()


@router.post("/run", status_code=status.HTTP_201_CREATED) #  , response_model=schemas.ScheduleOut
def generate_schedule(
    zone_id: int,
    schedule_date: datetime,
    db: Session = Depends(database.get_db),
    api_key: str = Depends(oauth2.require_system_key)
):
    triggeredAt = datetime.now()
    dbMgr = ga_service.DBMgr(db, zone_id, schedule_date)
    best_schedule, generations, fitness_history = find_fittest_schedule(dbMgr)
    completedAt = datetime.now()

    # DisplayMgr.plot_convergence(fitness_history)
    # DisplayMgr.plot_workload_balance(best_schedule, dbMgr)

    new_schedule = models.GASchedule(
        TriggeredAt=triggeredAt,
        CompletedAt=completedAt,
        FitnessValue=best_schedule.get_fitness(),
        Generations=generations,
        TotalTasks=dbMgr.get_numberOfTasks(),
        TotalCleaners=dbMgr.get_numberOfCleaners(),
        ZoneID=zone_id
    )
    db.add(new_schedule)
    db.flush()
    schedule_id = new_schedule.ScheduleID

    for assignment in best_schedule.get_assignments():
        new_assignment = models.Assignment(
            Status='Assigned',
            EstimatedDuration=assignment.get_estimated_duration(),
            SpaceID=assignment.get_space().get_space_id(),
            TaskID=assignment.get_task().get_task_id(),
            ScheduleID=schedule_id,
            CleanerID=assignment.get_cleaner().get_user_id()
        )
        db.add(new_assignment)
    db.commit()

    return {
        "Success": "true",
        "Time": datetime.now(),
        "Generations": generations,
        "Fitness": best_schedule.get_fitness(),
        "Violations": len(best_schedule.get_violations()),
        "Assignments": [str(a) for a in best_schedule.get_assignments()],
    }
