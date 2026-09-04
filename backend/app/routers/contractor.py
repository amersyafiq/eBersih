from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models, utils, oauth2
from ..config import database
from ..service import contractor_service, user_service
from typing import List

router = APIRouter(
    prefix="/contractor",
    tags=['Contractor']
)

ADMIN_ONLY = Depends(oauth2.require_role("Facility Admin"))
ADMIN_CONTRACTOR = Depends(oauth2.require_role("Facility Admin", "Contractor"))
AUTHENTICATED = Depends(oauth2.get_current_user)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut, dependencies=[ADMIN_ONLY])
def create_contractor(user: schemas.CreateUser, db: Session = Depends(database.get_db)):
    user.Password = utils.hash(user.Password)
    user.Role = 'Contractor'
    return user_service.create_user(db, user)

@router.get("/", response_model=List[schemas.UserOut], dependencies=[ADMIN_CONTRACTOR])
def get_cleaners(company_id: int | None = None, zone_id: int | None = None, db: Session = Depends(database.get_db)):
    return contractor_service.get_contractors(db, company_id, zone_id)

@router.get("/{contractor_id}", response_model=schemas.UserOut, dependencies=[ADMIN_CONTRACTOR])
def get_contractor(contractor_id: int, db: Session = Depends(database.get_db)):
    return contractor_service.get_contractor(db, contractor_id)
