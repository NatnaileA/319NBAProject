from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    # The frontend sends this shape for both register and login.
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=3, max_length=100)


@router.post("/register")
def register(payload: AuthRequest, request: Request, db: Session = Depends(get_db)):
    # Usernames must be unique, so registration checks before inserting.
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Class-project simplification: store the plain password from the form.
    user = User(username=payload.username, password=payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Saving user_id in the session cookie logs the user in.
    request.session["user_id"] = user.id
    return {"id": user.id, "username": user.username}


@router.post("/login")
def login(payload: AuthRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    request.session["user_id"] = user.id
    return {"id": user.id, "username": user.username}


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)):
    # The frontend calls this on page load to see if someone is logged in.
    user_id = request.session.get("user_id")
    if not user_id:
        return {"user": None}

    user = db.get(User, user_id)
    if not user:
        request.session.clear()
        return {"user": None}

    return {"user": {"id": user.id, "username": user.username}}


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Other routers use this dependency to protect routes.
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")

    user = db.get(User, user_id)
    if not user:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Login required")

    return user
