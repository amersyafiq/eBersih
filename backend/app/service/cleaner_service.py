from ..models import User, Company, Zone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

def get_cleaners(db, company_id, zone_id):
    query = db.query(User).filter(User.Role == 'Cleaner')
    if company_id is not None: query = query.filter(User.CompanyID == company_id)
    if zone_id is not None: query = query.filter(User.ZoneID == zone_id)
    cleaners = query.all()

    if not cleaners: raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="Cleaners not found" )
    return cleaners

def get_cleaners_pekerja_am(db, company_id, zone_id):
    query = db.query(User).filter(User.Role == 'Cleaner', User.Category == 'Pekerja Am')
    if company_id is not None: query = query.filter(User.CompanyID == company_id)
    if zone_id is not None: query = query.filter(User.ZoneID == zone_id)
    cleaners = query.all()

    if not cleaners: raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="Cleaners not found" )
    return cleaners

def get_cleaners_operator_mesin(db, company_id, zone_id):
    query = db.query(User).filter(User.Role == 'Cleaner', User.Category == 'Operator Mesin')
    if company_id is not None: query = query.filter(User.CompanyID == company_id)
    if zone_id is not None: query = query.filter(User.ZoneID == zone_id)
    cleaners = query.all()

    if not cleaners: raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="Cleaners not found" )
    return cleaners

def get_cleaners_penyelia(db, company_id, zone_id):
    query = db.query(User).filter(User.Role == 'Cleaner', User.Category == 'Penyelia')
    if company_id is not None: query = query.filter(User.CompanyID == company_id)
    if zone_id is not None: query = query.filter(User.ZoneID == zone_id)
    cleaners = query.all()

    if not cleaners: raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="Cleaners not found" )
    return cleaners

def get_cleaner(db, cleaner_id):
    cleaner = db.query(User).filter(User.Role == 'Cleaner', User.UserID == cleaner_id).first()
    if not cleaner: raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail=f"Cleaner with id {cleaner_id} not found" )
    return cleaner