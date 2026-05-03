from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    # entity_type is "team" or "player"; entity_name is what the UI displays.
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity_type = Column(String(20), nullable=False)
    entity_id = Column(String(80), nullable=False)
    entity_name = Column(String(120), nullable=False)

    user = relationship("User", back_populates="favorites")
