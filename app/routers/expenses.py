from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends, status
from app.database import get_db
from app.auth import get_current_user
from app import schema, crud
from typing import List
from app.routers import auth
from datetime import date

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/", response_model=List[schema.ExpenseResponse])
def get_expenses(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_expenses(db, current_user)

@router.get("/{expense_id}", response_model=schema.ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return crud.get_expense(db, expense_id, current_user)

@router.get("/filter", response_model=List[schema.ExpenseResponse])
def filter_expenses(
    min_amount: float,
    db : Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.filter_expense(db, min_amount, current_user)

@router.post("/", response_model=schema.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: schema.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return crud.create_expense(db, expense, current_user)

@router.put("/{expense_id}", response_model=schema.ExpenseResponse)
def update_expense(
    expense_id: int,
    updated: schema.ExpenseUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_expense(db, expense_id, updated)


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db : Session = Depends(get_db)
):
    return crud.delete_expense(db, expense_id)

@router.get("/by-date")
def get_by_date(
    start_date: date,
    end_date: date,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_expenses_by_date(
        db,
        current_user.id,
        start_date,
        end_date
    )

@router.get("/total")
def total_spending(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = crud.get_total_spending(
        db,
        current_user.id
    )
    return {
        "total_spending": total or 0
    }