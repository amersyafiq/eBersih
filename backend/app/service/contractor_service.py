from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..models import User


def get_contractors(db: Session, company_id: int | None = None, zone_id: int | None = None):
	query = db.query(User).options(joinedload(User.company), joinedload(User.zone)).filter(User.Role == "Contractor")
	if company_id is not None:
		query = query.filter(User.CompanyID == company_id)
	if zone_id is not None:
		query = query.filter(User.ZoneID == zone_id)
	contractors = query.all()
	if not contractors:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractors not found")
	return contractors


def get_contractor(db: Session, contractor_id: int):
	contractor = db.query(User).options(
		joinedload(User.company), joinedload(User.zone)
	).filter(User.UserID == contractor_id, User.Role == "Contractor").first()
	if not contractor:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
	return contractor
