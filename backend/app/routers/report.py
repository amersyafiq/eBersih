from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import oauth2, schemas
from ..config import database
from ..service import report_service

router = APIRouter(prefix="/report", tags=["Reports"])


@router.get("/summary", response_model=schemas.ReportSummary, dependencies=[Depends(oauth2.get_current_user)])
def get_summary(db: Session = Depends(database.get_db)):
    return report_service.get_summary(db)