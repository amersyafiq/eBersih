from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models, utils, oauth2
from ..config import database
from ..service import cleaner_service, user_service
from typing import Optional, List

router = APIRouter(
    prefix="/cleaner",
    tags=['User']
)

CONTRACTOR_ONLY = Depends(oauth2.require_role("Contractor"))
ADMIN_CONTRACTOR = Depends(oauth2.require_role("Facility Admin", "Contractor"))
AUTHENTICATED = Depends(oauth2.get_current_user)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut, dependencies=[ADMIN_CONTRACTOR])
def create_cleaner(user: schemas.CreateUser, db: Session = Depends(database.get_db)):
    user.Password = utils.hash(user.Password)
    user.Role = 'Cleaner'
    return user_service.create_user(db, user)

@router.get("/", response_model=List[schemas.UserOut], dependencies=[ADMIN_CONTRACTOR])
def get_cleaners(company_id: int | None = None, zone_id: int | None = None, db: Session = Depends(database.get_db)):
    return cleaner_service.get_cleaners(db, company_id, zone_id)

@router.get("/pekerja-am", response_model=List[schemas.UserOut], dependencies=[ADMIN_CONTRACTOR])
def get_cleaners_pekerja_am(company_id: int | None = None, zone_id: int | None = None, db: Session = Depends(database.get_db)):
    return cleaner_service.get_cleaners_pekerja_am(db, company_id, zone_id)

@router.get("/operator-mesin", response_model=List[schemas.UserOut], dependencies=[ADMIN_CONTRACTOR])
def get_cleaners_operator_mesin(company_id: int | None = None, zone_id: int | None = None, db: Session = Depends(database.get_db)):
    return cleaner_service.get_cleaners_operator_mesin(db, company_id, zone_id)

@router.get("/penyelia", response_model=List[schemas.UserOut], dependencies=[ADMIN_CONTRACTOR])
def get_cleaners_penyelia(company_id: int | None = None, zone_id: int | None = None, db: Session = Depends(database.get_db)):
    return cleaner_service.get_cleaners_penyelia(db, company_id, zone_id)

@router.get("/{cleaner_id}", response_model=schemas.UserOut, dependencies=[ADMIN_CONTRACTOR])
def get_cleaner(cleaner_id: int, db: Session = Depends(database.get_db)):
    return cleaner_service.get_cleaner(db, cleaner_id)