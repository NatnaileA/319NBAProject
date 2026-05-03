import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.database import Base, engine
from app.models import Favorite, User
from app.routers import auth, favorites, scoreboard


# Creates the users and favorites tables when the backend starts.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NBA Playoff Tracker API")

# Allows the React dev server to call this API from localhost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"http://\d+\.\d+\.\d+\.\d+:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stores the logged-in user's id in a signed browser cookie.
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "dev-secret-change-me"),
    same_site="lax",
    https_only=False,
)

app.include_router(auth.router)
app.include_router(favorites.router)
app.include_router(scoreboard.router)


@app.get("/")
def root():
    return {"message": "NBA Playoff Tracker API"}
