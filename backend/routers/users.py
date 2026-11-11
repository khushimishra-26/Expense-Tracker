from fastapi import APIRouter
from backend import schema
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import crud
from backend import schema
from backend import models
from fastapi import HTTPException

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=schema.UserResponse)
def register(
    user: schema.UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.username == user.username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    return crud.create_user(db, user)