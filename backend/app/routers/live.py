from datetime import datetime
from typing import List
import matplotlib.pyplot as plt

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import schemas, oauth2

from ..config import database
from ..service import live_service

from datetime import datetime

router = APIRouter(
    prefix="/live",
    tags=['Live Map']
)

ADMIN_CONTRACTOR = Depends(oauth2.require_role("Facility Admin", "Contractor"))

@router.get("/{schedule_date}", response_model=List[schemas.BuildingStatus], dependencies=[ADMIN_CONTRACTOR])
def get_buildings_status(
    schedule_date: datetime,
    db: Session = Depends(database.get_db),
    current_user: dict = ADMIN_CONTRACTOR
):
    return live_service.get_buildings_status(db, current_user.CampusCode, schedule_date)

@router.get("/details/{building_code}", response_model=schemas.BuildingDetailsResponse, dependencies=[ADMIN_CONTRACTOR])
def get_buildings_status(
    building_code: str,
    schedule_date: datetime,
    db: Session = Depends(database.get_db),
    current_user: dict = ADMIN_CONTRACTOR
):
    return live_service.get_building_details(db, building_code, current_user.CampusCode, schedule_date)