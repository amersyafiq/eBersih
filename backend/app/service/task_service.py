import json
from datetime import datetime, date, time
from typing import Optional, List
from zoneinfo import ZoneInfo
from fastapi import HTTPException, status
from sqlalchemy import Date, cast
from sqlalchemy.orm import Session, joinedload

from ..models import Task, TaskGroup, TaskGroupTask, Assignment, GASchedule, Space, Floor, Block, Zone, Attendance
from .. import schemas


def _get_or_404(db, model, field, value, label):
    item = db.query(model).filter(field == value).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    return item


def get_tasks(db: Session):
    return db.query(Task).all()


def get_task(db: Session, task_id: int):
    return _get_or_404(db, Task, Task.TaskID, task_id, "Task")


def create_task(db: Session, data):
    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task_groups(db: Session):
    return db.query(TaskGroup).all()


def get_task_group(db: Session, task_group_id: int):
    return _get_or_404(db, TaskGroup, TaskGroup.TaskGroupID, task_group_id, "Task group")


def create_task_group(db: Session, data):
    task_group = TaskGroup(**data.model_dump())
    db.add(task_group)
    db.commit()
    db.refresh(task_group)
    return task_group


def get_task_group_tasks(db: Session, task_group_id: int):
    get_task_group(db, task_group_id)
    return db.query(TaskGroupTask).filter(TaskGroupTask.TaskGroupID == task_group_id).all()


def add_task_to_group(db: Session, data):
    get_task_group(db, data.TaskGroupID)
    get_task(db, data.TaskID)
    existing = db.query(TaskGroupTask).filter(
        TaskGroupTask.TaskGroupID == data.TaskGroupID,
        TaskGroupTask.TaskID == data.TaskID,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is already in this group")
    link = TaskGroupTask(**data.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def remove_task_from_group(db: Session, task_group_id: int, task_id: int):
    link = db.query(TaskGroupTask).filter(
        TaskGroupTask.TaskGroupID == task_group_id,
        TaskGroupTask.TaskID == task_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task group link not found")
    db.delete(link)
    db.commit()


def format_assignment(assignment: Assignment) -> schemas.CleanerTaskItem:
    task = assignment.task
    space = assignment.space
    floor = space.floor if space else None
    block = floor.block if floor else None

    est_duration = assignment.EstimatedDuration
    if not est_duration and task and task.DurationValue:
        est_duration = int(task.DurationValue)
    if not est_duration:
        est_duration = 15

    start_time_str = assignment.StartTime.strftime("%H:%M:%S") if assignment.StartTime else None
    end_time_str = assignment.EndTime.strftime("%H:%M:%S") if assignment.EndTime else None

    return schemas.CleanerTaskItem(
        AssignID=assignment.AssignID,
        TaskID=assignment.TaskID,
        TaskName=task.TaskName if task else "Tugasan Pembersihan",
        TaskType=task.TaskType if task else "General",
        SpaceID=assignment.SpaceID,
        SpaceCode=space.SpaceCode if space else "",
        SpaceName=space.SpaceName if space else "",
        FloorName=floor.FloorName if floor else "",
        BlockName=block.BlockName if block else "",
        EstimatedDuration=est_duration,
        Status=assignment.Status,
        StartTime=start_time_str,
        EndTime=end_time_str,
        CleanRating=assignment.CleanRating,
    )


def get_cleaner_schedule_tasks(db: Session, date_str: str, cleaner_id: int) -> schemas.CleanerScheduleDetailResponse:
    today_myt = datetime.now(ZoneInfo("Asia/Kuala_Lumpur")).date()
    try:
        if "T" in date_str:
            target_date = datetime.fromisoformat(date_str.split("T")[0]).date()
        else:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        target_date = today_myt

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.UserID == cleaner_id,
            cast(Attendance.AttendanceDate, Date) == target_date,
        )
        .first()
    )
    is_attended = attendance is not None and attendance.ClockInTime is not None

    assignments = (
        db.query(Assignment)
        .join(GASchedule, Assignment.ScheduleID == GASchedule.ScheduleID)
        .filter(
            Assignment.CleanerID == cleaner_id,
            cast(GASchedule.ScheduleDate, Date) == target_date,
        )
        .options(
            joinedload(Assignment.task),
            joinedload(Assignment.space).joinedload(Space.floor).joinedload(Floor.block),
            joinedload(Assignment.schedule).joinedload(GASchedule.zone),
        )
        .order_by(Assignment.SpaceID, Assignment.AssignID)
        .all()
    )

    zone_code = None
    zone_name = None
    if assignments and assignments[0].schedule and assignments[0].schedule.zone:
        zone_code = assignments[0].schedule.zone.ZoneCode
        zone_name = assignments[0].schedule.zone.ZoneName

    spaces_dict = {}
    total_tasks = 0
    completed_tasks = 0

    for a in assignments:
        total_tasks += 1
        if a.Status and a.Status.lower() in ("completed", "selesai"):
            completed_tasks += 1

        s = a.space
        if not s:
            continue

        if s.SpaceID not in spaces_dict:
            floor = s.floor
            block = floor.block if floor else None
            qr_payload = s.QRCode
            if not qr_payload:
                qr_payload = json.dumps({
                    "app": "ebersih",
                    "version": "1.0",
                    "type": "space",
                    "space_code": s.SpaceCode,
                    "space_name": s.SpaceName,
                    "floor": floor.FloorName if floor else "",
                    "block": block.BlockName if block else "",
                })

            spaces_dict[s.SpaceID] = {
                "SpaceID": s.SpaceID,
                "SpaceCode": s.SpaceCode,
                "SpaceName": s.SpaceName,
                "FloorName": floor.FloorName if floor else "",
                "BlockName": block.BlockName if block else "",
                "QRCode": qr_payload,
                "tasks": [],
            }

        spaces_dict[s.SpaceID]["tasks"].append(format_assignment(a))

    return schemas.CleanerScheduleDetailResponse(
        ScheduleDate=target_date,
        ZoneCode=zone_code,
        ZoneName=zone_name,
        isToday=(target_date == today_myt),
        isAttended=is_attended,
        totalTasks=total_tasks,
        completedTasks=completed_tasks,
        spaces=list(spaces_dict.values()),
    )


def get_cleaner_assignment(db: Session, assign_id: int, cleaner_id: int) -> schemas.CleanerTaskItem:
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.AssignID == assign_id,
            Assignment.CleanerID == cleaner_id,
        )
        .options(
            joinedload(Assignment.task),
            joinedload(Assignment.space).joinedload(Space.floor).joinedload(Floor.block),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return format_assignment(assignment)


def update_cleaner_assignment(
    db: Session, assign_id: int, cleaner_id: int, data: schemas.AssignmentUpdate
) -> schemas.CleanerTaskItem:
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.AssignID == assign_id,
            Assignment.CleanerID == cleaner_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if data.Status is not None:
        assignment.Status = data.Status
    if data.StartTime is not None:
        try:
            assignment.StartTime = datetime.strptime(data.StartTime, "%H:%M:%S").time()
        except ValueError:
            pass
    if data.EndTime is not None:
        try:
            assignment.EndTime = datetime.strptime(data.EndTime, "%H:%M:%S").time()
        except ValueError:
            pass
    if data.CleanRating is not None:
        assignment.CleanRating = data.CleanRating

    db.commit()
    db.refresh(assignment)
    return get_cleaner_assignment(db, assign_id, cleaner_id)


def cleaner_clock_in(db: Session, cleaner_id: int, clock_in_date: Optional[date] = None):
    today_myt = datetime.now(ZoneInfo("Asia/Kuala_Lumpur")).date()
    target_date = clock_in_date or today_myt
    now_myt = datetime.now(ZoneInfo("Asia/Kuala_Lumpur"))

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.UserID == cleaner_id,
            cast(Attendance.AttendanceDate, Date) == target_date,
        )
        .first()
    )
    if not attendance:
        attendance = Attendance(
            AttendanceDate=target_date,
            ClockInTime=now_myt,
            UserID=cleaner_id,
        )
        db.add(attendance)
    else:
        if not attendance.ClockInTime:
            attendance.ClockInTime = now_myt

    db.commit()
    db.refresh(attendance)
    return {
        "status": "success",
        "message": "Clocked in successfully",
        "AttendanceID": attendance.AttendanceID,
        "AttendanceDate": str(attendance.AttendanceDate),
        "ClockInTime": attendance.ClockInTime.isoformat() if attendance.ClockInTime else None,
    }
