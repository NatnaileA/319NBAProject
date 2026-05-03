from fastapi import APIRouter, HTTPException, Query
from httpx import HTTPError

from app.services.espn_service import espn_service


router = APIRouter(prefix="/scoreboard", tags=["scoreboard"])


@router.get("")
async def scoreboard(date: str | None = Query(default=None, description="Optional YYYY-MM-DD date")):
    # ESPN data is fetched fresh; game data is not stored in PostgreSQL.
    try:
        return await espn_service.get_scoreboard(date)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not fetch ESPN scoreboard") from exc


@router.get("/{game_id}/boxscore")
async def box_score(game_id: str):
    # Returns player box-score rows for one ESPN game id.
    try:
        return await espn_service.get_box_score(game_id)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not fetch ESPN box score") from exc


@router.get("/players/{player_id}/playoff-stats")
async def player_playoff_stats(player_id: str):
    # Used when a favorite player's name is clicked in the favorites table.
    try:
        return await espn_service.get_player_playoff_stats(player_id)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not fetch ESPN player playoff stats") from exc
