import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/nba_playoff_tracker",
)

# SQLAlchemy engine points at the PostgreSQL database.
engine = create_engine(DATABASE_URL)

# Each request gets its own database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    # All SQLAlchemy models inherit from this Base class.
    pass


def get_db():
    # FastAPI dependency: open a DB session, then close it after the request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
