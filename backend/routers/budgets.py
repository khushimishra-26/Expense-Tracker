from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend import crud, schema
from backend.auth import get_current_user
from backend.database import get_db

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("/", response_model=List[schema.BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_budgets(db, current_user)

@router.put("/", response_model=schema.BudgetResponse)
def set_budget(
    budget: schema.BudgetSet,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.set_budget(db, budget, current_user)

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    crud.delete_budget(db, budget_id, current_user)
