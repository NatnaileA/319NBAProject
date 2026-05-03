from datetime import date
from typing import Any

import httpx


class ESPNService:
    BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
    WEB_API_BASE_URL = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba"

    async def get_scoreboard(self, game_date: str | None = None) -> list[dict[str, Any]]:
        # ESPN wants dates as YYYYMMDD, but the frontend date input gives YYYY-MM-DD.
        params: dict[str, str] = {"seasontype": "3", "limit": "100"}
        if game_date:
            params["dates"] = game_date.replace("-", "")

        data = await self._get_json("/scoreboard", params=params)
        return [self._parse_game(event) for event in data.get("events", [])]

    async def get_box_score(self, game_id: str) -> dict[str, Any]:
        # Summary includes both team info and box-score player rows.
        data = await self._get_json("/summary", params={"event": game_id})
        header = data.get("header", {})
        competitions = header.get("competitions", [])
        boxscore = data.get("boxscore", {})

        return {
            "game_id": game_id,
            "name": header.get("name"),
            "date": competitions[0].get("date") if competitions else None,
            "teams": self._parse_box_teams(boxscore),
            "players": self._parse_players(boxscore),
        }

    async def get_player_playoff_stats(self, player_id: str, season: int | None = None) -> dict[str, Any]:
        # Player gamelog is used when clicking a favorite player in the UI.
        selected_season = season or date.today().year
        url = f"{self.WEB_API_BASE_URL}/athletes/{player_id}/gamelog"
        params = {"season": str(selected_season), "seasontype": "3"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        labels = self._find_stat_labels(data)
        games = self._find_player_stat_games(data, labels)
        totals = self._total_player_stats(games)

        return {
            "player_id": player_id,
            "season": selected_season,
            "games": games,
            "totals": totals,
            "espn_url": f"https://www.espn.com/nba/player/gamelog/_/id/{player_id}",
        }

    async def _get_json(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        # Shared ESPN GET helper so routes do not repeat HTTP client code.
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{self.BASE_URL}{path}", params=params)
            response.raise_for_status()
            return response.json()

    def _parse_game(self, event: dict[str, Any]) -> dict[str, Any]:
        # Keep only the fields the React scoreboard needs.
        competition = event.get("competitions", [{}])[0]
        competitors = competition.get("competitors", [])
        home = self._find_competitor(competitors, "home")
        away = self._find_competitor(competitors, "away")
        status_type = event.get("status", {}).get("type", {})

        return {
            "id": event.get("id"),
            "name": event.get("name"),
            "short_name": event.get("shortName"),
            "date": event.get("date"),
            "status": {
                "state": status_type.get("state"),
                "description": status_type.get("description"),
                "detail": event.get("status", {}).get("detail"),
            },
            "home": self._parse_team(home),
            "away": self._parse_team(away),
        }

    def _find_competitor(self, competitors: list[dict[str, Any]], home_away: str) -> dict[str, Any]:
        for competitor in competitors:
            if competitor.get("homeAway") == home_away:
                return competitor
        return {}

    def _parse_team(self, competitor: dict[str, Any]) -> dict[str, Any]:
        team = competitor.get("team", {})
        records = competitor.get("records", [])
        return {
            "id": team.get("id"),
            "display_name": team.get("displayName"),
            "abbreviation": team.get("abbreviation"),
            "logo": team.get("logo"),
            "score": competitor.get("score", "0"),
            "winner": competitor.get("winner", False),
            "record": records[0].get("summary") if records else None,
        }

    def _parse_box_teams(self, boxscore: dict[str, Any]) -> list[dict[str, Any]]:
        teams = []
        for item in boxscore.get("teams", []):
            team = item.get("team", {})
            teams.append(
                {
                    "id": team.get("id"),
                    "display_name": team.get("displayName"),
                    "abbreviation": team.get("abbreviation"),
                    "logo": team.get("logo"),
                    "statistics": item.get("statistics", []),
                }
            )
        return teams

    def _parse_players(self, boxscore: dict[str, Any]) -> list[dict[str, Any]]:
        # ESPN sends box-score rows as labels + values; convert them into objects.
        players = []
        for team_box in boxscore.get("players", []):
            team = team_box.get("team", {})
            for category in team_box.get("statistics", []):
                labels = category.get("labels", [])
                if not labels:
                    continue

                for athlete_row in category.get("athletes", []):
                    athlete = athlete_row.get("athlete", {})
                    stats = athlete_row.get("stats", [])
                    stat_map = dict(zip(labels, stats))
                    field_goals = stat_map.get("FG", "0-0")

                    players.append(
                        {
                            "id": athlete.get("id"),
                            "name": athlete.get("displayName"),
                            "team_id": team.get("id"),
                            "team": team.get("displayName"),
                            "points": self._safe_int(stat_map.get("PTS")),
                            "rebounds": self._safe_int(stat_map.get("REB")),
                            "assists": self._safe_int(stat_map.get("AST")),
                            "fg": field_goals,
                            "fg_pct": self._field_goal_percentage(field_goals),
                            "raw": stat_map,
                        }
                    )
        return players

    def _field_goal_percentage(self, field_goals: str) -> float:
        try:
            made, attempted = [int(value) for value in field_goals.split("-")]
        except ValueError:
            return 0.0

        if attempted == 0:
            return 0.0
        return round((made / attempted) * 100, 1)

    def _safe_int(self, value: str | None) -> int:
        try:
            return int(value or 0)
        except ValueError:
            return 0

    def _find_stat_labels(self, data: Any) -> list[str]:
        # ESPN gamelog responses are nested, so this finds the stat labels recursively.
        if isinstance(data, dict):
            for key in ("labels", "names", "displayNames"):
                value = data.get(key)
                if isinstance(value, list) and all(isinstance(item, str) for item in value):
                    return value
            for value in data.values():
                found = self._find_stat_labels(value)
                if found:
                    return found
        if isinstance(data, list):
            for item in data:
                found = self._find_stat_labels(item)
                if found:
                    return found
        return []

    def _find_player_stat_games(self, data: Any, labels: list[str]) -> list[dict[str, Any]]:
        # Walk the gamelog JSON and collect rows that look like player stat lines.
        games = []

        def walk(value: Any):
            if isinstance(value, dict):
                stats = value.get("stats")
                if isinstance(stats, list) and stats:
                    stat_map = dict(zip(labels, stats)) if labels else {}
                    has_scoring_stats = {"PTS", "REB", "AST"}.issubset(stat_map.keys())
                    is_total_row = str(value.get("type", "")).lower() in {"total", "totals"}
                    if has_scoring_stats and not is_total_row:
                        games.append(
                            {
                                "date": value.get("gameDate") or value.get("date"),
                                "opponent": self._opponent_name(value.get("opponent")),
                                "result": value.get("gameResult") or value.get("result"),
                                "points": self._safe_int(stat_map.get("PTS")),
                                "rebounds": self._safe_int(stat_map.get("REB")),
                                "assists": self._safe_int(stat_map.get("AST")),
                                "fg_pct": self._safe_float(stat_map.get("FG%") or stat_map.get("FGPCT")),
                                "raw": stat_map,
                            }
                        )
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(data)
        unique_games = []
        seen = set()
        for game in games:
            key = (game.get("date"), game.get("opponent"), game.get("points"), game.get("rebounds"), game.get("assists"))
            # Skip stat rows that are actually season/playoff totals instead of one game.
            if game["points"] + game["rebounds"] + game["assists"] == 0:
                continue
            if key not in seen:
                seen.add(key)
                unique_games.append(game)
        return unique_games

    def _total_player_stats(self, games: list[dict[str, Any]]) -> dict[str, Any]:
        game_count = len(games)
        points = sum(game["points"] for game in games)
        rebounds = sum(game["rebounds"] for game in games)
        assists = sum(game["assists"] for game in games)

        return {
            "games": game_count,
            "points": points,
            "rebounds": rebounds,
            "assists": assists,
            "pra": points + rebounds + assists,
            "ppg": round(points / game_count, 1) if game_count else 0,
            "rpg": round(rebounds / game_count, 1) if game_count else 0,
            "apg": round(assists / game_count, 1) if game_count else 0,
        }

    def _opponent_name(self, opponent: Any) -> str | None:
        if isinstance(opponent, dict):
            return opponent.get("displayName") or opponent.get("abbreviation") or opponent.get("name")
        if isinstance(opponent, str):
            return opponent
        return None

    def _safe_float(self, value: str | None) -> float:
        try:
            return round(float(value or 0), 1)
        except ValueError:
            return 0.0


espn_service = ESPNService()
