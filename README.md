# NBA Playoff Tracker

Simple NBA Playoff Tracker using:

- Backend: Python, FastAPI, psycopg2
- Frontend: plain HTML, vanilla JavaScript, CSS
- Database: PostgreSQL
- External data: ESPN public API

No React, Axios, SQLAlchemy, auth, build tools, or `node_modules` are required.

## Project Structure

```text
backend/
  main.py
  requirements.txt

frontend/
  index.html
  game.html
  app.js
  game.js
  style.css

.env
README.md
```

## Features

- Scoreboard page with a date picker.
- Game cards show teams, logos, records, scores, and game status.
- Info button opens a box score page for that game.
- Box score page shows player points, rebounds, assists, and FG%.
- Favorite teams are saved in PostgreSQL.
- Favorite teams can be removed with the `x` button.

## PostgreSQL Setup

Create the database:

```sql
CREATE DATABASE nba_playoff_tracker;
```

The backend creates this table automatically:

```sql
favorite_teams (
  id SERIAL PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL
)
```

Edit `.env` if your PostgreSQL password is not `postgres`:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nba_playoff_tracker
```

## Backend Setup

```powershell
cd "C:\Users\natna\OneDrive\CMSC 365 Work\proj319\backend"
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

## Frontend Setup

Open this file in your browser:

```text
frontend/index.html
```

If browser security blocks `fetch()`, serve the folder with Python:

```powershell
cd "C:\Users\natna\OneDrive\CMSC 365 Work\proj319\frontend"
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## API Routes

- `GET /scoreboard?date=YYYY-MM-DD`
- `GET /boxscore/{gameId}`
- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites/{team_id}`
