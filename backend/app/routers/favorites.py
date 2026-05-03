from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.favorite import Favorite
from app.models.user import User
from app.routers.auth import require_user


router = APIRouter(prefix="/favorites", tags=["favorites"])


class FavoriteRequest(BaseModel):
    # One table stores both team favorites and player favorites.
    entity_type: str = Field(pattern="^(team|player)$")
    entity_id: str = Field(min_length=1, max_length=80)
    entity_name: str = Field(min_length=1, max_length=120)


@router.get("")
def list_favorites(current_user: User = Depends(require_user)):
    # Only returns favorites for the currently logged-in user.
    return [
        {
            "id": favorite.id,
            "entity_type": favorite.entity_type,
            "entity_id": favorite.entity_id,
            "entity_name": favorite.entity_name,
        }
        for favorite in current_user.favorites
    ]


@router.post("")
def add_favorite(
    payload: FavoriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    # Avoid duplicate favorites for the same user/team or user/player.
    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.entity_type == payload.entity_type,
            Favorite.entity_id == payload.entity_id,
        )
        .first()
    )
    if existing:
        return {
            "id": existing.id,
            "entity_type": existing.entity_type,
            "entity_id": existing.entity_id,
            "entity_name": existing.entity_name,
        }

    favorite = Favorite(
        user_id=current_user.id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        entity_name=payload.entity_name,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return {
        "id": favorite.id,
        "entity_type": favorite.entity_type,
        "entity_id": favorite.entity_id,
        "entity_name": favorite.entity_name,
    }


@router.delete("/{favorite_id}")
def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    # Remove by database favorite id. Used by the favorites table.
    favorite = (
        db.query(Favorite)
        .filter(Favorite.id == favorite_id, Favorite.user_id == current_user.id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()
    return {"message": "Favorite removed"}


@router.delete("/{entity_type}/{entity_id}")
def delete_favorite_by_entity(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    # Remove by entity type/id. Used by player stars on the box score page.
    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.entity_type == entity_type,
            Favorite.entity_id == entity_id,
        )
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()
    return {"message": "Favorite removed"}
