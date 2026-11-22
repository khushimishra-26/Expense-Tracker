import os
import hashlib
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter, HTTPException, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
import auth, crud, database, models
from database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

# The refresh token lives in an httpOnly cookie so JavaScript can never read it.
# Set COOKIE_SECURE=true in production (HTTPS only).
REFRESH_COOKIE = "refresh_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = ("none" if COOKIE_SECURE else "lax")


def set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=auth.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth",
    )


def find_refresh_token(token: str, db: Session):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return (
        db.query(models.RefreshToken)
        .filter(models.RefreshToken.token_hash == token_hash)
        .first()
    )


@router.post("/login")
def login(
    response: Response,
    request: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = crud.authenticate_user(db, request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = auth.create_access_token({"sub": user.username})
    set_refresh_cookie(response, auth.create_refresh_token(user.id, db))

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh")
def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Not logged in")

    db_token = find_refresh_token(refresh_token, db)
    if db_token is None or db_token.revoked:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    expires_at = db_token.expires_at
    if expires_at.tzinfo is None:  # SQLite returns naive datetimes
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Rotate: the old refresh token can't be used again
    db_token.revoked = True
    db.commit()
    set_refresh_cookie(response, auth.create_refresh_token(user.id, db))

    new_access_token = auth.create_access_token({"sub": user.username})
    return {"access_token": new_access_token, "token_type": "bearer", "username": user.username}


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if refresh_token:
        db_token = find_refresh_token(refresh_token, db)
        if db_token:
            db_token.revoked = True
            db.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/auth")
    return {"detail": "Logged out"}
