from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # Stores app accounts. Password is plain text for this class-project version.
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(128), nullable=False)

    # One user can have many favorite teams/players.
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
