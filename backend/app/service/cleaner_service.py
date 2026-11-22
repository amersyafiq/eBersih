from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import Boolean, DateTime, case, cast, distinct, exists, func, literal_column, select, text

from ..models import Assignment, Attendance, GASchedule, User, Company, Zone
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

def get_task_completed(db, cleaner_id):
    start_of_week = func.DATETRUNC(literal_column("WEEK"), func.GETDATE())
    end_of_week = func.DATEADD(literal_column("DAY"), 7, start_of_week)

    count = (
        db.query(func.count())
        .select_from(User)
        .outerjoin(Assignment, Assignment.CleanerID == User.UserID)
        .outerjoin(GASchedule, GASchedule.ScheduleID == Assignment.ScheduleID)
        .where(
            Assignment.CleanerID == cleaner_id,
            GASchedule.ScheduleDate >= start_of_week,
            GASchedule.ScheduleDate < end_of_week,
        )
        .scalar()
    )

    return count

def get_cleaner_schedules(db, limit, cleaner_id):
    today_myt = datetime.now(ZoneInfo("Asia/Kuala_Lumpur")).date()

    attendance_exists = exists(
        select(1).where(
            Attendance.UserID == cleaner_id,
            Attendance.AttendanceDate >= cast(GASchedule.ScheduleDate, DateTime),
            Attendance.AttendanceDate < cast(func.dateadd(text("DAY"), 1, GASchedule.ScheduleDate), DateTime),
        )
    )

    schedules = (
        db.query(
            GASchedule.ScheduleDate.label("ScheduleDate"),
            Zone.ZoneCode.label("ZoneCode"),
            cast(case((GASchedule.ScheduleDate == today_myt, 1), else_=0), Boolean).label("isToday"),
            cast(case((attendance_exists, 1), else_=0), Boolean).label("isAttended"),
            func.count(Assignment.AssignID).label("taskCount"),
            func.count(distinct(Assignment.SpaceID)).label("spaceCount"),
        )
        .join(Assignment, GASchedule.ScheduleID == Assignment.ScheduleID)
        .outerjoin(Zone, GASchedule.ZoneID == Zone.ZoneID)
        .where(Assignment.CleanerID == cleaner_id)
        .group_by(GASchedule.ScheduleDate, Zone.ZoneCode)
        .order_by(GASchedule.ScheduleDate.desc(), Zone.ZoneCode.asc())
        .limit(limit)
        .all()
    )

    return schedules
