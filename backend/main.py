import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="NBA Playoff Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def espn_get(url, params=None):
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail=f"ESPN request failed: {error}") from error


def find_competitor(competitors, home_away):
    for competitor in competitors:
        if competitor.get("homeAway") == home_away:
            return competitor
    return {}


def shape_team(competitor):
    team = competitor.get("team", {})
    records = competitor.get("records", [])
    return {
        "id": team.get("id"),
        "name": team.get("displayName"),
        "abbreviation": team.get("abbreviation"),
        "logo": team.get("logo"),
        "score": competitor.get("score", "0"),
        "record": records[0].get("summary") if records else "",
    }


@app.get("/scoreboard")
def get_scoreboard(date: str):
    espn_date = date.replace("-", "")
    data = espn_get(
        "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
        params={"dates": espn_date, "seasontype": "3", "limit": "100"},
    )

    games = []
    for event in data.get("events", []):
        competition = event.get("competitions", [{}])[0]
        competitors = competition.get("competitors", [])
        status_type = event.get("status", {}).get("type", {})

        games.append({
            "id": event.get("id"),
            "name": event.get("name"),
            "date": event.get("date"),
            "status": status_type.get("description") or "Unknown",
            "status_detail": event.get("status", {}).get("detail") or "",
            "home": shape_team(find_competitor(competitors, "home")),
            "away": shape_team(find_competitor(competitors, "away")),
        })

    return games


@app.get("/boxscore/{game_id}")
def get_boxscore(game_id: str):
    data = espn_get(
        "http://cdn.espn.com/core/nba/game",
        params={"gameId": game_id, "xhr": "1"},
    )

    gamepackage = data.get("gamepackageJSON", {})
    boxscore = gamepackage.get("boxscore", {})
    header = gamepackage.get("header", {})

    teams = []
    for team_data in boxscore.get("players", []):
        team = team_data.get("team", {})
        team_players = []

        for stat_group in team_data.get("statistics", []):
            labels = stat_group.get("labels", [])
            for athlete_data in stat_group.get("athletes", []):
                athlete = athlete_data.get("athlete", {})
                stats = dict(zip(labels, athlete_data.get("stats", [])))
                fg = stats.get("FG", "0-0")
                made, attempted = parse_made_attempted(fg)

                team_players.append({
                    "id": athlete.get("id"),
                    "name": athlete.get("displayName"),
                    "points": safe_int(stats.get("PTS")),
                    "rebounds": safe_int(stats.get("REB")),
                    "assists": safe_int(stats.get("AST")),
                    "fg": fg,
                    "fg_pct": round((made / attempted) * 100, 1) if attempted else 0,
                })

        teams.append({
            "id": team.get("id"),
            "name": team.get("displayName"),
            "abbreviation": team.get("abbreviation"),
            "logo": team.get("logo"),
            "players": team_players,
        })

    return {
        "game_id": game_id,
        "name": header.get("name", "Box Score"),
        "teams": teams,
    }


def parse_made_attempted(value):
    try:
        made, attempted = value.split("-")
        return int(made), int(attempted)
    except (ValueError, AttributeError):
        return 0, 0


def safe_int(value):
    try:
        return int(value or 0)
    except ValueError:
        return 0