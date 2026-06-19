from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Retrieve summary statistics for the dashboard:
    - Total products, customers, and orders.
    - Products with low stock (quantity <= 10).
    """
    return crud.get_dashboard_stats(db)


@router.get("/logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), limit: int = 50):
    """
    Retrieve recent system activity logs.
    """
    return crud.get_audit_logs(db, limit=limit)

