from sqlalchemy.orm import Session
from backend import auth, crud, schema, database, models
from fastapi import Depends, APIRouter, HTTPException
import hashlib
from backend.database import get_db
from datetime import datetime, timezone
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix= "/auth", tags = ["Auth"])

@router.post("/login")
def login(
    request: OAuth2PasswordRequestForm = Depends(),
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
            detail="Invalid username or password"
        )
    access_token = auth.create_access_token({"sub": user.username})
    refresh_token = auth.create_refresh_token(user.id, db)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh")
def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    db_token = (
        db.query(models.RefreshToken)
        .filter(models.RefreshToken.token_hash == token_hash)
        .first()
    )

    if db_token is None or db_token.revoked:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = auth.create_access_token({"sub": user.username})

    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token_hash == token_hash).first()
    if db_token:
        db_token.revoked = True
        db.commit()
    return {"detail": "Logged out"}