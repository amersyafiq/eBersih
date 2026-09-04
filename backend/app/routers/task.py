from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from typing import List

from .. import oauth2, schemas
from ..config import database
from ..service import task_service

router = APIRouter(prefix="/task", tags=["Task Management"])

ADMIN_ONLY = Depends(oauth2.require_role("Facility Admin"))
AUTHENTICATED = Depends(oauth2.get_current_user)


@router.get("/", response_model=List[schemas.TaskOut], dependencies=[AUTHENTICATED])
def get_tasks(db: Session = Depends(database.get_db)):
    return task_service.get_tasks(db)


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED, dependencies=[ADMIN_ONLY])
def create_task(data: schemas.TaskCreate, db: Session = Depends(database.get_db)):
    return task_service.create_task(db, data)


@router.get("/groups/", response_model=List[schemas.TaskGroupOut], dependencies=[AUTHENTICATED])
def get_task_groups(db: Session = Depends(database.get_db)):
    return task_service.get_task_groups(db)


@router.post("/groups/", response_model=schemas.TaskGroupOut, status_code=status.HTTP_201_CREATED, dependencies=[ADMIN_ONLY])
def create_task_group(data: schemas.TaskGroupCreate, db: Session = Depends(database.get_db)):
    return task_service.create_task_group(db, data)


@router.get("/groups/{task_group_id}", response_model=schemas.TaskGroupOut, dependencies=[AUTHENTICATED])
def get_task_group(task_group_id: int, db: Session = Depends(database.get_db)):
    return task_service.get_task_group(db, task_group_id)


@router.get("/groups/{task_group_id}/tasks", response_model=List[schemas.TaskGroupTaskOut], dependencies=[AUTHENTICATED])
def get_task_group_tasks(task_group_id: int, db: Session = Depends(database.get_db)):
    return task_service.get_task_group_tasks(db, task_group_id)


@router.post("/groups/tasks", response_model=schemas.TaskGroupTaskOut, status_code=status.HTTP_201_CREATED, dependencies=[ADMIN_ONLY])
def add_task_to_group(data: schemas.TaskGroupTaskCreate, db: Session = Depends(database.get_db)):
    return task_service.add_task_to_group(db, data)


@router.delete("/groups/{task_group_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[ADMIN_ONLY])
def remove_task_from_group(task_group_id: int, task_id: int, db: Session = Depends(database.get_db)):
    task_service.remove_task_from_group(db, task_group_id, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{task_id}", response_model=schemas.TaskOut, dependencies=[AUTHENTICATED])
def get_task(task_id: int, db: Session = Depends(database.get_db)):
    return task_service.get_task(db, task_id)