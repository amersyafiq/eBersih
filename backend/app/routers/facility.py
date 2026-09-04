from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models, utils, oauth2
from ..config import database
from ..service import facility_service
from typing import Optional, List

router = APIRouter(
    prefix="/facility",
    tags=['Facility Management']
)

ADMIN_ONLY = Depends(oauth2.require_role("Facility Admin"))
AUTHENTICATED = Depends(oauth2.get_current_user)

# Campus
@router.get("/campus", response_model=List[schemas.CampusOut], dependencies=[AUTHENTICATED])
def get_campuses(db: Session = Depends(database.get_db)):
    return facility_service.get_campuses(db)

@router.get("/campus/{campus_code}", response_model=schemas.CampusOut, dependencies=[AUTHENTICATED])
def get_campus(campus_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_campus(db, campus_code)


# Zone
@router.get("/campus/{campus_code}/zone", response_model=List[schemas.ZoneOut], dependencies=[AUTHENTICATED])
def get_zones(campus_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_zones(db, campus_code)

@router.get("/zone/{zone_id}", response_model=schemas.ZoneOut, dependencies=[AUTHENTICATED])
def get_zones(zone_id: str, db: Session = Depends(database.get_db)):
    return facility_service.get_zone(db, zone_id)


# Building
@router.get("/campus/{campus_code}/zone/{zone_code}/building", response_model=List[schemas.BuildingOut], dependencies=[AUTHENTICATED])
def get_buildings(campus_code: str, zone_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_buildings(db, campus_code, zone_code)

@router.get("/building/{building_id}", response_model=schemas.BuildingOut, dependencies=[AUTHENTICATED])
def get_building(building_id: str, db: Session = Depends(database.get_db)):
    return facility_service.get_building(db, building_id)


# Block
@router.get("/campus/{campus_code}/zone/{zone_code}/building/{building_code}/block", response_model=List[schemas.BlockOut], dependencies=[AUTHENTICATED])
def get_blocks(campus_code: str, zone_code: str, building_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_blocks(db, campus_code, zone_code, building_code)

@router.get("/block/{block_id}", response_model=schemas.BlockOut, dependencies=[AUTHENTICATED])
def get_block(block_id: str, db: Session = Depends(database.get_db)):
    return facility_service.get_block(db, block_id)


# Floor
@router.get("/campus/{campus_code}/zone/{zone_code}/building/{building_code}/block/{block_code}/floor", response_model=List[schemas.FloorOut], dependencies=[AUTHENTICATED])
def get_floors(campus_code: str, zone_code: str, building_code: str, block_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_floors(db, campus_code, zone_code, building_code, block_code)

@router.get("/floor/{floor_id}", response_model=schemas.FloorOut, dependencies=[AUTHENTICATED])
def get_floor(floor_id: str, db: Session = Depends(database.get_db)):
    return facility_service.get_floor(db, floor_id)


# Space
@router.get("/campus/{campus_code}/zone/{zone_code}/building/{building_code}/block/{block_code}/floor/{floor_code}/space", response_model=List[schemas.SpaceOut], dependencies=[AUTHENTICATED])
def get_spaces(campus_code: str, zone_code: str, building_code: str, block_code: str, floor_code: str, db: Session = Depends(database.get_db)):
    return facility_service.get_spaces(db, campus_code, zone_code, building_code, block_code, floor_code)

@router.get("/space/{space_id}", response_model=schemas.SpaceOut, dependencies=[AUTHENTICATED])
def get_space(space_id: str, db: Session = Depends(database.get_db)):
    return facility_service.get_space(db, space_id)