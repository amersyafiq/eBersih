from datetime import datetime, date, timedelta
import calendar
import statistics

from fastapi import HTTPException, status
from sqlalchemy import and_
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
	def __repr__(self): return str(self._task) + " @ " + str(self._space) + " (" + str(self._estimated_duration) + "m) "


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
	def __init__(self, space, task, estimated_duration):
		self._space = space
		self._task = task
		self._cleaner = None
		self._estimated_duration = estimated_duration

	def get_space(self): return self._space
	def get_task(self): return self._task
	def get_cleaner(self): return self._cleaner
	def get_estimated_duration(self): return self._estimated_duration

	def set_cleaner(self, cleaner): self._cleaner = cleaner

	def __str__(self): return str(self._task) + " @ " + str(self._space) + " -> " + str(self._cleaner) + " (" + str(self._estimated_duration) + ")"
	def __repr__(self): return str(self._task) + " @ " + str(self._space) + " -> " + str(self._cleaner) + " (" + str(self._estimated_duration) + ")"


class DBMgr:
	def __init__(self, db: Session, zone_id: int, schedule_date: datetime):
		self._db = db
		self._zone_id = zone_id
		self._schedule_date = schedule_date
		self._cleaners = self.select_cleaners()
		self._weekly_completed = self.select_assignments('weekly')
		self._monthly_completed = self.select_assignments('monthly')
		self._duration_history = self.select_duration_history()
		self._spacetasks = self.select_spacetasks()
		self._numberOfTasks = len(self._spacetasks)
		self._numberOfCleaners = len(self._cleaners)

	# Get available cleaners
	# Filtered byy: ZoneID, Role, IsActive, LeaveRequest
	# Return available cleaners
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

		return [Cleaner(cleaner.UserID, cleaner.Fullname, cleaner.Category) for cleaner in cleaners]

	# Populate weekly_completed and monthly_completed
	# Get completed assignments based on frequency value and frequency type
	# Return completed assignments dictionary
	def select_assignments(self, frequency_type):
		if frequency_type == 'weekly':
			week_start = self._schedule_date - timedelta(days=self._schedule_date.weekday())
			week_end = week_start + timedelta(days=5)
		elif frequency_type == 'monthly':
			week_start = None
			week_end = None
			month_start = self._schedule_date.replace(day=1)
			month_end = self._schedule_date.replace(day=calendar.monthrange(self._schedule_date.year, self._schedule_date.month)[1])
		else:
			return {}
		
		assignments = self._db.query(models.Assignment, models.TaskGroupTask.FrequencyValue) \
		.join(models.GASchedule, models.Assignment.ScheduleID == models.GASchedule.ScheduleID) \
		.join(models.Space, models.Assignment.SpaceID == models.Space.SpaceID) \
		.join(models.Floor, models.Space.FloorID == models.Floor.FloorID) \
		.join(models.Block, models.Floor.BlockID == models.Block.BlockID) \
		.join(models.Building, models.Block.BuildingID == models.Building.BuildingID) \
		.join(models.Task, models.Assignment.TaskID == models.Task.TaskID) \
		.join(models.TaskGroup, models.Space.TaskGroupID == models.TaskGroup.TaskGroupID) \
		.join(models.TaskGroupTask, and_( models.TaskGroup.TaskGroupID == models.TaskGroupTask.TaskGroupID, models.Task.TaskID == models.TaskGroupTask.TaskID)) \
		.filter(
			models.Building.ZoneID == self._zone_id,
			models.Assignment.Status == "Completed",
			models.GASchedule.ScheduleDate >= ( week_start if frequency_type == 'weekly' else month_start ),
			models.GASchedule.ScheduleDate <= ( week_end if frequency_type == 'weekly' else month_end ),
			models.TaskGroupTask.FrequencyType == frequency_type.title()
		).all()

		completed = {}
		for assignment, frequency_value in assignments:
			period = self.get_periods(frequency_type, frequency_value)
			if period is None: continue

			period_start, period_end = period
			key = (assignment.SpaceID, assignment.TaskID)

			if key not in completed: completed[key] = []
			completed[key].append((period_start, period_end))
		return completed

	# Get history of assigment's durations
	# To be used when creating new assignment
	DURATION_HISTORY_WINDOW_DAYS = 30 # How far back to look when building duration history.
	def select_duration_history(self):
		window_start = self._schedule_date - timedelta(days=self.DURATION_HISTORY_WINDOW_DAYS)

		rows = self._db.query(
            models.Assignment.SpaceID,
            models.Assignment.TaskID,
            models.Assignment.StartTime,
            models.Assignment.EndTime,
            models.GASchedule.ScheduleDate,
        ) \
        .join(models.GASchedule, models.Assignment.ScheduleID == models.GASchedule.ScheduleID) \
        .join(models.Space, models.Assignment.SpaceID == models.Space.SpaceID) \
        .join(models.Floor, models.Space.FloorID == models.Floor.FloorID) \
        .join(models.Block, models.Floor.BlockID == models.Block.BlockID) \
        .join(models.Building, models.Block.BuildingID == models.Building.BuildingID) \
        .filter(
            models.Building.ZoneID == self._zone_id,
            models.Assignment.Status == "Completed",
            models.Assignment.StartTime.isnot(None),
            models.Assignment.EndTime.isnot(None),
            models.GASchedule.ScheduleDate >= window_start,
            models.GASchedule.ScheduleDate <= self._schedule_date,
        ).all()

		history = {}
		for space_id, task_id, start_time, end_time, schedule_date in rows:
			duration = self._time_diff_minutes(start_time, end_time)
			if duration is None: continue
			key = (space_id, task_id)
			history.setdefault(key, []).append((schedule_date, duration))

        # Sort by schedule_date
		for key in history:
			history[key].sort(key=lambda pair: pair[0], reverse=True)

		return history


	def select_spacetasks(self):
		spacetasks = self._db.query(models.Space, models.Task, models.TaskGroupTask) \
		.join(models.Floor, models.Floor.FloorID == models.Space.FloorID, isouter=True) \
		.join(models.Block, models.Floor.BlockID == models.Block.BlockID, isouter=True) \
		.join(models.Building, models.Block.BuildingID == models.Building.BuildingID, isouter=True) \
		.join(models.TaskGroup, models.Space.TaskGroupID == models.TaskGroup.TaskGroupID, isouter=True) \
		.join(models.TaskGroupTask, models.TaskGroup.TaskGroupID == models.TaskGroupTask.TaskGroupID, isouter=True) \
		.join(models.Task, models.TaskGroupTask.TaskID == models.Task.TaskID) \
		.filter(
			models.Building.ZoneID == self._zone_id,
			models.Space.IsActive == True,
			models.Task.IsActive == True,
			models.TaskGroupTask.IsActive == True,
			models.Space.TaskGroupID != None
		).all()

		returnSpaceTasks = []
		for space, task, taskGroupTask in spacetasks:
			if self.is_task_due(space.SpaceID, task.TaskID, taskGroupTask):
				space_obj = Space(space.SpaceID, space.SpaceCode, space.SpaceName, space.SpaceType, space.FloorID, space.SpaceDescription, space.SpaceArea, space.SpaceEPU, space.TaskGroupID)

				history = self._duration_history.get((space.SpaceID, task.TaskID), [])
				estimated_duration = self.estimate_duration(space_obj, task, history)

				returnSpaceTasks.append( SpaceTask(space_obj, Task(task.TaskID, task.TaskName, task.TaskType, task.RequiredCategory, task.DurationBasis, task.DurationValue), taskGroupTask.Slot, estimated_duration) )
		return returnSpaceTasks


	WEEKLY_PERIODS = {
		1: [(0, 6)],
		2: [(0, 2), (3, 6)],
		3: [(0, 1), (2, 4), (5, 6)]
	}
	MONTHLY_PERIODS = {
		1: [(1, "last")],
		2: [(1, 15), (16, "last")],
		3: [(1, 10), (11, 20), (21, "last")]
	}

	def get_periods(self, frequency_type, frequency_value):
		period_start = period_end = None
		if frequency_type == "weekly":
			periods = self.WEEKLY_PERIODS.get(frequency_value)
			if not periods:
				raise HTTPException(
					status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
					detail={"code": "UNSUPPORTED_FREQUENCY_VALUE",
							"message": f"Weekly FrequencyValue={frequency_value} has no defined period split (only 1-3 supported)"}
				)
			weekday = self._schedule_date.weekday()
			week_start = self._schedule_date - timedelta(days=weekday)
			for start_day, end_day in periods:
				if start_day <= weekday <= end_day:
					period_start = week_start + timedelta(days=start_day)
					period_end = week_start + timedelta(days=end_day)
					break

		elif frequency_type == "monthly":
			periods = self.MONTHLY_PERIODS.get(frequency_value)
			if not periods:
				raise HTTPException(
					status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
					detail={"code": "UNSUPPORTED_FREQUENCY_VALUE",
							"message": f"Monthly FrequencyValue={frequency_value} has no defined period split (only 1-3 supported)"}
				)
			current_day = self._schedule_date.day
			total_days = calendar.monthrange(self._schedule_date.year, self._schedule_date.month)[1]
			for start_day, end_day in periods:
				if end_day == "last": end_day = total_days
				if start_day <= current_day <= end_day:
					period_start = self._schedule_date.replace(day=start_day)
					period_end = self._schedule_date.replace(day=end_day)
					break

		else:
			raise HTTPException(
				status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
				detail={"code": "UNSUPPORTED_FREQUENCY_TYPE",
						"message": f"FrequencyType '{frequency_type}' is not supported "
								f"(Daily / Weekly / Monthly / On Demand only)"}
			)
		
		return period_start, period_end


	def is_task_due(self, space_id, task_id, tgt):
		frequency_type = (tgt.FrequencyType or "").strip().lower()
		frequency_value = tgt.FrequencyValue or 1

		if frequency_type == "on demand": return False
		if frequency_type == "daily": return True

		period_start, period_end = self.get_periods(frequency_type, frequency_value)

		if frequency_type == "weekly":
			completed_periods = self._weekly_completed.get((space_id, task_id), set())
		elif frequency_type == "monthly":
			completed_periods = self._monthly_completed.get((space_id, task_id), set())
		else: return False

		return (period_start, period_end) not in completed_periods


	MIN_DURATION_BY_TASK_TYPE = {
		"General": 3,
		"Washroom": 3,
		"Specialized": 5,
	}

	def estimate_duration(self, space, task, duration_history):
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

	def get_cleaners_by_category(self, category): return [c for c in self._cleaners if c.get_category() == category]

	def get_schedule_date(self): return self._schedule_date
	def get_spaces(self): return self._spaces
	def get_cleaners(self): return self._cleaners
	def get_spacetasks(self): return self._spacetasks
	def get_numberOfTasks(self): return self._numberOfTasks
	def get_numberOfCleaners(self): return self._numberOfCleaners