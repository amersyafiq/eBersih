from collections import defaultdict
from datetime import datetime, date, timedelta
import calendar
import math
import statistics

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from .. import models

class Space:
	def __init__(self, space_id, space_code, space_name, space_type, floor_id, space_description, space_area, space_epu, taskgroup_id):
		self._space_id = space_id
		self._space_code = space_code
		self._space_name = space_name
		self._space_type = space_type
		self._floor_id = floor_id
		self._space_description = space_description
		self._space_area = space_area
		self._space_epu = space_epu
		self._taskgroup_id = taskgroup_id

	def get_space_id(self): return self._space_id
	def get_space_code(self): return self._space_code
	def get_space_name(self): return self._space_name
	def get_space_type(self): return self._space_type
	def get_floor_id(self): return self._floor_id
	def get_space_description(self): return self._space_description
	def get_space_area(self): return self._space_area
	def get_space_epu(self): return self._space_epu
	def get_taskgroup_id(self): return self._taskgroup_id

	def __str__(self): return str(self._space_code)


class Task:
	def __init__(self, task_id, task_name, task_type, required_category, duration_basis, duration_value):
		self._task_id = task_id
		self._task_name = task_name
		self._task_type = task_type
		self._required_category = required_category
		self._duration_basis = duration_basis
		self._duration_value = duration_value

	def get_task_id(self): return self._task_id
	def get_task_name(self): return self._task_name
	def get_task_type(self): return self._task_type
	def get_required_category(self): return self._required_category
	def get_duration_basis(self): return self._duration_basis
	def get_duration_value(self): return self._duration_value

	def __str__(self): return str(self._task_name)


class SpaceTask:
	# Represents a specific task to be performed in a specific space, with an estimated duration.
	def __init__(self, space, task, slot, estimated_duration):
		self._space = space
		self._task = task
		self._slot = slot
		self._estimated_duration = estimated_duration

	def get_space(self): return self._space
	def get_task(self): return self._task
	def get_slot(self): return self._slot
	def get_estimated_duration(self): return self._estimated_duration

	def __str__(self): return str(self._task) + " @ " + str(self._space) + " (" + str(self._estimated_duration) + "m) "
	def __repr__(self): return self.__str__()

class SpaceTaskGroup:
	# Represents a group of SpaceTasks that are linked together by the same Space
    def __init__(self, space, category, spacetasks, periodic_load=0.0):
        self._space = space
        self._category = category
        self._spacetasks = spacetasks
        self._periodic_load = periodic_load
        self._daily_minutes = sum(st.get_estimated_duration() for st in spacetasks)

    def get_space(self): return self._space
    def get_category(self): return self._category
    def get_spacetasks(self): return self._spacetasks
    def get_task_count(self): return len(self._spacetasks)
    def get_daily_minutes(self): return self._daily_minutes
    def get_periodic_load(self): return self._periodic_load
    def get_total_minutes(self): return self._daily_minutes + self._periodic_load

    def __str__(self): return f"SpaceTaskGroup({self._space}, {self._category}, {len(self._spacetasks)} tasks, {self._daily_minutes}m daily, {self._periodic_load} periodic load)"
    def __repr__(self): return self.__str__()


class Cleaner:
	def __init__(self, user_id, fullname, category):
		self._user_id = user_id
		self._fullname = fullname
		self._category = category

	def get_user_id(self): return self._user_id
	def get_fullname(self): return self._fullname
	def get_category(self): return self._category

	def __str__(self): return str(self._fullname)
	def __repr__(self): return "'"+str(self._fullname)+"'"


class Assignment:
    def __init__(self, spacetaskgroup):
        self._cleaner = None
        self._spacetaskgroup = spacetaskgroup

    def get_spacetaskgroup(self): return self._spacetaskgroup
    def get_cleaner(self): return self._cleaner
    def set_cleaner(self, cleaner): self._cleaner = cleaner
        
    def __str__(self): return f"{self._spacetaskgroup} -> {self._cleaner}"
    def __repr__(self): return self.__str__()


class DBMgr:
    # Working minutes per cleaner
    WEEKDAY_SHIFT_MINS = 480  # 8 hours
    SATURSDAY_SHIFT_MINS = 300 # 5 hours

    # Share of the shift kept free for non-daily tasks
    PERIODIC_BUFFER_RATIO = 1/6

    WORKING_DAYS_PER_WEEK = 6  # Mon-Sat
    WORKING_DAYS_PER_MONTH = 26  # Mon-Sat, excluding public holidays

    # The number of days to look back for calculating the average duration of a task for a space, based on historical data.
    DURATION_HISTORY_WINDOW_DAYS = 30

    MIN_DURATION_BY_TASK_TYPE = {
		"General": 3,
		"Washroom": 3,
		"Specialized": 5,
    }

    SLOT_ORDER = {
		"morning": 0,
        "afternoon": 1,
        "evening": 2,
    }

    def __init__(self, db: Session, zone_id: int, schedule_date: date):
        self._db = db
        self._zone_id = zone_id
        self._schedule_date = schedule_date
        self._cleaners = self.select_cleaners()
        self._duration_history = self.select_duration_history()
        self._spacetaskgroups = self.select_spacetaskgroups()
        self._number_of_taskgroups = len(self._spacetaskgroups)
        self._number_of_tasks = sum(stg.get_task_count() for stg in self._spacetaskgroups)
        self._number_of_cleaners = len(self._cleaners)

    # Helpers function
    def get_max_shift_minutes(self): return self.WEEKDAY_SHIFT_MINS if self._schedule_date.weekday() < 5 else self.SATURSDAY_SHIFT_MINS
    def get_daily_capacity_minutes(self): return int(round(self.get_max_shift_minutes() * (1 - self.PERIODIC_BUFFER_RATIO)))
    def get_buffer_minutes(self): return int(round(self.get_max_shift_minutes() * self.PERIODIC_BUFFER_RATIO))
    def _time_diff_minutes(self, start_time, end_time):
        # Calculate the difference in minutes between two time objects
        delta = datetime.combine(date.min, end_time) - datetime.combine(date.min, start_time)
        return delta.total_seconds() / 60
    def estimate_duration(self, space, task, duration_history):
        # Estimate the duration of a task for a space based on historical data, or fallback to task's default duration.
        recent = sorted(duration_history, key=lambda x: x[0], reverse=True)[:10]
        durations = [minutes for _, minutes in recent]
        if len(durations) >= 3:
            estimate = statistics.median(durations)
        elif task.DurationBasis == "Area" and space.get_space_area():
            estimate = task.DurationValue * space.get_space_area() + 1
        else:
            estimate = task.DurationValue
        floor = self.MIN_DURATION_BY_TASK_TYPE.get(task.TaskType, 3)
        return round(max(estimate, floor))
    def _slot_key(self, slot): return self.SLOT_ORDER.get((slot or "").strip().lower(), 99)

    # Fetch cleaners for the zone, excluding those on approved leave for the schedule date
    def select_cleaners(self):
        if not self._zone_id: return []

        on_leave_subquery = self._db.query(models.LeaveRequest.UserID).filter(
            models.LeaveRequest.Status == "Approved",
            models.LeaveRequest.StartDate <= self._schedule_date,
            models.LeaveRequest.EndDate >= self._schedule_date
        ).subquery()

        cleaners = self._db.query(models.User).filter(
            models.User.ZoneID == self._zone_id,
            models.User.Role == "Cleaner",
            models.User.IsActive == True,
            ~models.User.UserID.in_(on_leave_subquery)
        ).all()

        return [Cleaner(c.UserID, c.Fullname, (c.Category or "").strip()) for c in cleaners]

    # Fetch the duration history for each space-task pair based on completed assignments within the defined window
    def select_duration_history(self):
        window_start = self._schedule_date - timedelta(days=self.DURATION_HISTORY_WINDOW_DAYS)

        rows = (
            self._db.query(
                models.Assignment.SpaceID,
                models.Assignment.TaskID,
                models.Assignment.StartTime,
                models.Assignment.EndTime,
                models.GASchedule.ScheduleDate,
            )
            .join(models.GASchedule, models.Assignment.ScheduleID == models.GASchedule.ScheduleID)
            .join(models.Space, models.Assignment.SpaceID == models.Space.SpaceID)
            .join(models.Floor, models.Space.FloorID == models.Floor.FloorID)
            .join(models.Block, models.Floor.BlockID == models.Block.BlockID)
            .join(models.Building, models.Block.BuildingID == models.Building.BuildingID)
            .filter(
                models.Building.ZoneID == self._zone_id,
                models.Assignment.Status == "Completed",
                models.Assignment.StartTime.isnot(None),
                models.Assignment.EndTime.isnot(None),
                models.GASchedule.ScheduleDate >= window_start,
                models.GASchedule.ScheduleDate <= self._schedule_date,
            )
            .all()
        )

        history = {}
        for space_id, task_id, start_time, end_time, schedule_date in rows:
            duration = self._time_diff_minutes(start_time, end_time)
            if duration is None:
                continue
            history.setdefault((space_id, task_id), []).append((schedule_date, duration))

        for key in history:
            history[key].sort(key=lambda pair: pair[0], reverse=True)
        return history

    def select_spacetasks(self):
        freq = func.lower(func.trim(models.TaskGroupTask.FrequencyType))
        return (
            self._db.query(models.Space, models.Task, models.TaskGroupTask)
            .join(models.Floor, models.Floor.FloorID == models.Space.FloorID)
            .join(models.Block, models.Floor.BlockID == models.Block.BlockID)
            .join(models.Building, models.Block.BuildingID == models.Building.BuildingID)
            .join(models.TaskGroupTask, models.Space.TaskGroupID == models.TaskGroupTask.TaskGroupID)
            .join(models.Task, models.TaskGroupTask.TaskID == models.Task.TaskID)
            .filter(
                models.Building.ZoneID == self._zone_id,
                models.Space.IsActive == True,
                models.Task.IsActive == True,
                models.TaskGroupTask.IsActive == True,
                models.Space.TaskGroupID != None,
                freq.in_(("daily", "weekly", "monthly")),
            )
            .all()
        )

    def select_spacetaskgroups(self):
        spacetasks = self.select_spacetasks()

        space_cache = {}
        daily = defaultdict(list) # (space_id, category) -> [SpaceTask]
        periodic_load = defaultdict(float) # (space_id, category) -> minutes per working day

        for space, task, tgt in spacetasks:
            if space.SpaceID not in space_cache:
                space_cache[space.SpaceID] = Space(space.SpaceID, space.SpaceCode, space.SpaceName, space.SpaceType, space.FloorID, space.SpaceDescription, space.SpaceArea, space.SpaceEPU, space.TaskGroupID)
            space_obj = space_cache[space.SpaceID]
            category = (task.RequiredCategory or "").strip()
            key = (space.SpaceID, category)

            history = self._duration_history.get((space.SpaceID, task.TaskID), [])
            estimated = self.estimate_duration(space_obj, task, history)

            freq_type = (tgt.FrequencyType or "").strip().lower()
            freq_value = tgt.FrequencyValue or 1
            if freq_type == "daily":
                task_obj = Task(task.TaskID, task.TaskName, task.TaskType, category, task.DurationBasis, task.DurationValue)
                daily[key].append(SpaceTask(space_obj, task_obj, tgt.Slot, estimated))
            elif freq_type == "weekly":
                periodic_load[key] += estimated * freq_value / self.WORKING_DAYS_PER_WEEK
            elif freq_type == "monthly":
                periodic_load[key] += estimated * freq_value / self.WORKING_DAYS_PER_MONTH

        spacetaskgroups = []
        # Order by floor, space, category
        for key in sorted(daily, key=lambda k: (space_cache[k[0]].get_floor_id(), k[0], k[1])):
            space_id, category = key
            spacetasks = sorted(daily[key], key=lambda st: (self._slot_key(st.get_slot()), st.get_task().get_task_id()))
            spacetaskgroups.append(SpaceTaskGroup(space_cache[space_id], category, spacetasks, periodic_load.get(key, 0.0)))

        return spacetaskgroups

    def get_cleaners_by_category(self, category):
        return [c for c in self._cleaners if c.get_category() == category]

    def get_schedule_date(self): return self._schedule_date
    def get_cleaners(self): return self._cleaners
    def get_spacetaskgroups(self): return self._spacetaskgroups
    def get_number_of_taskgroups(self): return self._number_of_taskgroups
    def get_number_of_tasks(self): return self._number_of_tasks
    def get_number_of_cleaners(self): return self._number_of_cleaners

