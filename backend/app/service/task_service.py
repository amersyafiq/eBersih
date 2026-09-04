from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import Task, TaskGroup, TaskGroupTask


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