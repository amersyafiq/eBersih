from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from ..schemas import ContractorCreate, ContractorTableResponse

from ..models import Company, CompanyZone, User, Zone


def get_contractors(db: Session, campus_code: str):
	user_count_subq = (
		db.query(func.count(User.UserID))
		.filter(User.CompanyID == Company.CompanyID)
		.correlate(Company)
		.as_scalar()
    )
	contractor_rows = (
		db.query(
			Company,
			user_count_subq.label("totalCleaners")
		)
		.outerjoin(CompanyZone, CompanyZone.CompanyID == Company.CompanyID)
		.outerjoin(Zone, Zone.ZoneID == CompanyZone.ZoneID)
		.filter(
			Zone.CampusCode == campus_code
		).all()
	)

	zone_rows = (
		db.query(
			CompanyZone.CompanyID,
			Zone.ZoneCode,
		)
		.outerjoin(CompanyZone, CompanyZone.ZoneID == Zone.ZoneID)
		.filter(
			Zone.CampusCode == campus_code
		).all()
	)
	zones_by_company = defaultdict(list)
	for zone in zone_rows:
		zones_by_company[zone.CompanyID].append(zone.ZoneCode)

	contractors_map = {}
	for company, total_cleaners in contractor_rows:
		if company.CompanyID not in contractors_map:
			contractors_map[company.CompanyID] = ContractorTableResponse(
				companyID=company.CompanyID,
				companyRegNo=company.CompanyRegNo,
				companyName=company.CompanyName,
				companyPhone=company.CompanyPhone,
				assignedZones=zones_by_company.get(company.CompanyID, []),
				totalCleaners=total_cleaners
			)
	
	contractor_data = list(contractors_map.values())
	return contractor_data


def create_contractor(db: Session, payload: ContractorCreate):
	exist_company = (
		db.query(Company)
		.filter(
			or_(
				Company.CompanyName == payload.companyName,
				Company.CompanyPhone == payload.companyPhone,
				Company.CompanyRegNo == payload.companyRegNo
			)
		).first()
	)
	if exist_company: raise HTTPException(status_code=404, detail="Company already exist.")

	new_company = Company(CompanyName=payload.companyName, CompanyRegNo=payload.companyRegNo, CompanyPhone=payload.companyPhone)
	db.add(new_company)
	db.flush()

	zone_ids = db.execute(select(Zone.ZoneID).where(Zone.ZoneCode.in_(payload.selectedZones))).scalars().all()
	for id in zone_ids:
		new_companyzone = CompanyZone(CompanyID=new_company.CompanyID, ZoneID=id, IsActive=1)
		db.add(new_companyzone)
	db.commit()

	db.refresh(new_company)
	return ContractorCreate(
		companyID=new_company.CompanyID,
		companyRegNo=new_company.CompanyRegNo,
		companyName=new_company.CompanyName,
		companyPhone=new_company.CompanyPhone,
		selectedZones=payload.selectedZones,
	)

	

def get_contractor(db: Session, contractor_id: int):
	contractor = db.query(User).options(
		joinedload(User.company), joinedload(User.zone)
	).filter(User.UserID == contractor_id, User.Role == "Contractor").first()
	if not contractor:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
	return contractor
