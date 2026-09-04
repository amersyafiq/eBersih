from ..models import User
from fastapi import HTTPException, status
from sqlalchemy.orm import joinedload

def create_user(db, user):
    email = db.query(User).filter(User.Email == user.Email).first()
    if email: raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f'This email already exists!')

    new_user = User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def get_users(db):
    users = db.query(User).options(
            joinedload(User.zone),
            joinedload(User.company)
        ).all() 
    return users