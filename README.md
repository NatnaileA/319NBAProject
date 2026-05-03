# NBA Playoff Tracker

React + FastAPI class project for checking NBA playoff games, viewing box scores, logging in, and saving favorite teams/players.

## Tech Stack

- Frontend: React, Axios, Tailwind CSS
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL
- External data: ESPN public API

PostgreSQL stores only users and favorites. ESPN game data is fetched fresh when the page loads or when the date changes.

## Project Structure

```text
frontend/
  src/
    pages/Scoreboard.jsx
    pages/BoxScore.jsx
    pages/Login.jsx
    components/GameCard.jsx
    api.js
backend/
  app/
    main.py
    database.py
    models/user.py
    models/favorite.py
    routers/auth.py
    routers/favorites.py
    routers/scoreboard.py
    services/espn_service.py
```

## PostgreSQL Setup

Create the database:

```sql
CREATE DATABASE nba_playoff_tracker;
```

The backend creates the `users` and `favorites` tables automatically when it starts.

If your PostgreSQL password is not `postgres`, set your database URL before starting the backend:

```powershell
$env:DATABASE_URL="postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/nba_playoff_tracker"
```

## Backend Setup

```powershell
cd "C:\Users\natna\OneDrive\CMSC 365 Work\proj319\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

## Frontend Setup

```powershell
cd "C:\Users\natna\OneDrive\CMSC 365 Work\proj319\frontend"
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Features

- Scoreboard page with a date picker.
- Game cards with scores, teams, and an info button.
- Box score page with player points, rebounds, assists, PRA, and FG%.
- Simple register/login using session cookies.
- Favorites table for saved teams and players.
- Favorite player names can be clicked to view playoff stat totals and gamelog rows.

## API Routes

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /scoreboard?date=YYYY-MM-DD`
- `GET /scoreboard/{game_id}/boxscore`
- `GET /scoreboard/players/{player_id}/playoff-stats`
- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites/{favorite_id}`
- `DELETE /favorites/{entity_type}/{entity_id}`
