from fastapi import APIRouter, Depends, status, HTTPException, Response
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import schemas, models, utils, oauth2
from ..config import database
from ..service import redis_service

router = APIRouter(
    prefix="/auth",
    tags=['Authentication']
)

@router.post("/login", response_model=schemas.Token)
def authenticate(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):

    user = db.query(models.User).filter(models.User.Email == user_credentials.username).first()
    if not user or not utils.verify(user_credentials.password, user.Password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invalid Credentials") 

    access_token = oauth2.create_access_token(data={"UserID": user.UserID})
    refresh_token = oauth2.create_refresh_token(user_id=str(user.UserID))

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh-token", response_model=schemas.Token)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id, jti = oauth2.verify_refresh_token(body.refresh_token, credentials_exception)
    user = db.query(models.User).filter(models.User.UserID == user_id).first()
    if not user: raise credentials_exception

    # rotate: old refresh token is single-use
    redis_service.revoke_refresh_token(user_id, jti)
    access_token = oauth2.create_access_token(data={"UserID": user.UserID})
    new_refresh_token = oauth2.create_refresh_token(user_id=str(user.UserID))

    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: schemas.RefreshRequest):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id, jti = oauth2.verify_refresh_token(body.refresh_token, credentials_exception)
    redis_service.revoke_refresh_token(user_id, jti)