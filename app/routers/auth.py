from sqlalchemy.orm import Session
from app import auth, crud, schema, database
from fastapi import Depends, APIRouter, HTTPException

router = APIRouter(prefix= "/auth", tags = ["Auth"])

@router.post("/login")
def login(
    request: schema.LoginRequest,
    db: Session = Depends(database.get_db)
):
    user = crud.authenticate_user(
        db,
        request.username,
        request.password
    )
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    token = auth.create_access_token(
        {
            "sub": user.username
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer"
    }