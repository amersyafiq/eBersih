from datetime import datetime, date, timedelta
import calendar
import math
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
	WEEKDAY_SHIFT_MINUTES = 480
	SATURDAY_SHIFT_MINUTES = 300
	
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
			range_start = self._schedule_date - timedelta(days=self._schedule_date.weekday())
			range_end = range_start + timedelta(days=6)
		elif frequency_type == 'monthly':
			range_start = self._schedule_date.replace(day=1)
			range_end = self._schedule_date.replace(
				day=calendar.monthrange(self._schedule_date.year, self._schedule_date.month)[1]
			)
		else:
			return {}

		rows = (
			self._db.query(
				models.Assignment.SpaceID,
				models.Assignment.TaskID,
				models.TaskGroupTask.FrequencyValue,
				models.GASchedule.ScheduleDate,
			)
			.join(models.GASchedule, models.Assignment.ScheduleID == models.GASchedule.ScheduleID)
			.join(models.Space, models.Assignment.SpaceID == models.Space.SpaceID)
			.join(models.Floor, models.Space.FloorID == models.Floor.FloorID)
			.join(models.Block, models.Floor.BlockID == models.Block.BlockID)
			.join(models.Building, models.Block.BuildingID == models.Building.BuildingID)
			.join(models.Task, models.Assignment.TaskID == models.Task.TaskID)
			.join(models.TaskGroup, models.Space.TaskGroupID == models.TaskGroup.TaskGroupID)
			.join(
				models.TaskGroupTask,
				and_(
					models.TaskGroup.TaskGroupID == models.TaskGroupTask.TaskGroupID,
					models.Task.TaskID == models.TaskGroupTask.TaskID,
				),
			)
			.filter(
				models.Building.ZoneID == self._zone_id,
				models.Assignment.Status == "Completed",
				models.GASchedule.ScheduleDate >= range_start,
				models.GASchedule.ScheduleDate <= range_end,
				models.TaskGroupTask.FrequencyType == frequency_type.title(),
			)
			.all()
		)

		completed = {}
		for space_id, task_id, frequency_value, completed_date in rows:
			# Pass completed_date so Period 1 completions don't mark Period 2 as done.
			period = self.get_periods(frequency_type, frequency_value or 1, ref_date=completed_date)
			if period is None:
				continue
			key = (space_id, task_id)
			completed.setdefault(key, set()).add(period)

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

	# Return (is_due, days_left_in_period) so we can pace periodic tasks
	def get_task_due_info(self, space_id, task_id, tgt):
		frequency_type = (tgt.FrequencyType or "").strip().lower()
		frequency_value = tgt.FrequencyValue or 1

		if frequency_type == "on demand":
			return False, None
		if frequency_type == "daily":
			return True, 0  # 0 days left = Mandatory Today

		period_start, period_end = self.get_periods(frequency_type, frequency_value)
		if not period_start or not period_end:
			return False, None

		if frequency_type == "weekly":
			completed_periods = self._weekly_completed.get((space_id, task_id), set())
		elif frequency_type == "monthly":
			completed_periods = self._monthly_completed.get((space_id, task_id), set())
		else:
			return False, None

		is_due = (period_start, period_end) not in completed_periods
		if not is_due:
			return False, None

		# Calculate how many days remain in this period (0 means today is the last day!)
		days_left = max(0, (period_end - self._schedule_date).days)
		return True, days_left


	def select_spacetasks(self):
		spacetasks = (
			self._db.query(models.Space, models.Task, models.TaskGroupTask)
			.join(models.Floor, models.Floor.FloorID == models.Space.FloorID, isouter=True)
			.join(models.Block, models.Floor.BlockID == models.Block.BlockID, isouter=True)
			.join(models.Building, models.Block.BuildingID == models.Building.BuildingID, isouter=True)
			.join(models.TaskGroup, models.Space.TaskGroupID == models.TaskGroup.TaskGroupID, isouter=True)
			.join(models.TaskGroupTask, models.TaskGroup.TaskGroupID == models.TaskGroupTask.TaskGroupID, isouter=True)
			.join(models.Task, models.TaskGroupTask.TaskID == models.Task.TaskID)
			.filter(
				models.Building.ZoneID == self._zone_id,
				models.Space.IsActive == True,
				models.Task.IsActive == True,
				models.TaskGroupTask.IsActive == True,
				models.Space.TaskGroupID != None,
			)
			.all()
		)

		# List of tuples: (days_left, space_id, SpaceTask)
		flexible_spacetasks = []
		mandatory_spacetasks = []

		# Track available minutes per cleaner category so we never exceed category capacity
		available_mins_by_cat = {}
		for c in self._cleaners:
			cat = c.get_category()
			available_mins_by_cat[cat] = available_mins_by_cat.get(cat, 0) + self.get_max_shift_minutes()

		for space, task, tgt in spacetasks:
			is_due, days_left = self.get_task_due_info(space.SpaceID, task.TaskID, tgt)
			if not is_due:
				continue

			space_obj = Space(
				space.SpaceID, space.SpaceCode, space.SpaceName, space.SpaceType,
				space.FloorID, space.SpaceDescription, space.SpaceArea, space.SpaceEPU, space.TaskGroupID
			)
			task_obj = Task(
				task.TaskID, task.TaskName, task.TaskType,
				task.RequiredCategory, task.DurationBasis, task.DurationValue
			)
			history = self._duration_history.get((space.SpaceID, task.TaskID), [])
			estimated_duration = self.estimate_duration(space_obj, task, history)
			st_obj = SpaceTask(space_obj, task_obj, tgt.Slot, estimated_duration)

			# Daily tasks OR periodic tasks on the LAST day of their period are mandatory today
			if days_left == 0:
				mandatory_spacetasks.append(st_obj)
				req_cat = task.RequiredCategory
				if req_cat in available_mins_by_cat:
					available_mins_by_cat[req_cat] -= estimated_duration
			else:
				flexible_spacetasks.append((days_left, space.FloorID, space.SpaceID, st_obj))

		# Sort flexible tasks by urgency (fewest days_left first), then group by FloorID & SpaceID
		flexible_spacetasks.sort(key=lambda x: (x[0], x[1], x[2]))

		# Take a proportional daily slice of periodic tasks, capped by remaining cleaner minutes
		# Group by days_left so we take ~1/(days_left + 1) of each period bucket per day
		selected_flexible = []
		bucket_counts = {}
		for days_left, _, _, _ in flexible_spacetasks:
			bucket_counts[days_left] = bucket_counts.get(days_left, 0) + 1

		bucket_quotas = {
			days_left: math.ceil(count / (days_left + 1))
			for days_left, count in bucket_counts.items()
		}
		bucket_taken = {days_left: 0 for days_left in bucket_counts}

		for days_left, _, _, st_obj in flexible_spacetasks:
			req_cat = st_obj.get_task().get_required_category()
			duration = st_obj.get_estimated_duration()

			# Check both the daily pacing quota AND remaining cleaner shift capacity
			if (
				bucket_taken[days_left] < bucket_quotas[days_left]
				and available_mins_by_cat.get(req_cat, 0) >= duration
			):
				selected_flexible.append(st_obj)
				bucket_taken[days_left] += 1
				available_mins_by_cat[req_cat] -= duration

		return mandatory_spacetasks + selected_flexible


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

	def get_periods(self, frequency_type, frequency_value, ref_date=None):
		target_date = ref_date or self._schedule_date
		period_start = period_end = None

		if frequency_type == "weekly":
			periods = self.WEEKLY_PERIODS.get(frequency_value)
			if not periods:
				raise HTTPException(
					status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
					detail={
						"code": "UNSUPPORTED_FREQUENCY_VALUE",
						"message": f"Weekly FrequencyValue={frequency_value} has no defined period split (only 1-3 supported)"
					}
				)
			weekday = target_date.weekday()
			week_start = target_date - timedelta(days=weekday)
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
					detail={
						"code": "UNSUPPORTED_FREQUENCY_VALUE",
						"message": f"Monthly FrequencyValue={frequency_value} has no defined period split (only 1-3 supported)"
					}
				)
			current_day = target_date.day
			total_days = calendar.monthrange(target_date.year, target_date.month)[1]
			for start_day, end_day in periods:
				if end_day == "last":
					end_day = total_days
				if start_day <= current_day <= end_day:
					period_start = target_date.replace(day=start_day)
					period_end = target_date.replace(day=end_day)
					break
		else:
			raise HTTPException(
				status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
				detail={
					"code": "UNSUPPORTED_FREQUENCY_TYPE",
					"message": f"FrequencyType '{frequency_type}' is not supported"
				}
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

	def get_max_shift_minutes(self): return self.SATURDAY_SHIFT_MINUTES if self._schedule_date.weekday() == 5 else self.WEEKDAY_SHIFT_MINUTES

	def get_cleaners_by_category(self, category): return [c for c in self._cleaners if c.get_category() == category]

	def get_schedule_date(self): return self._schedule_date
	def get_cleaners(self): return self._cleaners
	def get_spacetasks(self): return self._spacetasks
	def get_numberOfTasks(self): return self._numberOfTasks
	def get_numberOfCleaners(self): return self._numberOfCleaners