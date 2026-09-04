from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from .. import schemas, models, utils, oauth2
from ..config import database
from ..service import user_service
from typing import Optional, List

router = APIRouter(
    prefix="/user",
    tags=['User']
)

ADMIN_ONLY = Depends(oauth2.require_role("Facility Admin"))
AUTHENTICATED = Depends(oauth2.get_current_user)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut, dependencies=[ADMIN_ONLY])
def create_user(user: schemas.CreateUser, db: Session = Depends(database.get_db)):
    hashed_password = utils.hash(user.Password)
    user.Password = hashed_password
    new_user = user_service.create_user(db, user)
    return new_user

@router.get("/", response_model=List[schemas.UserOut], dependencies=[ADMIN_ONLY])
def get_users(db: Session = Depends(database.get_db)):
    users = user_service.get_users(db)
    return users