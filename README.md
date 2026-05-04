# NBA Playoff Tracker
NBA Playoff Tracker for this current playoffs using:
- Backend: Python, FastAPI, 
- Frontend: HTML,  JavaScript, CSS
- External data: ESPN public API
Had to take out the react and databases/with login. Last year I had fun with javascript so I thought it would be a good idea to try to also use react and build a project with it but it was getting a bit too complex especially when I tried with the database its something i'm going to have to try again in the future.

Features/Services
- Scoreboard page with a date selectore.
- Game cards show teams, logos, records, scores, and game status.
- Button that opens up a box score page for that game with player stats
- Can save a favorite teams locally and can be removed 

1. Start the backend
run
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Backend runs at http://localhost:8000
2. Start the frontend
cd frontend
python -m http.server 5500
Then open your browser and go to http://localhost:5500
## API Routes
GET games from a date /scoreboard?date=YYYY-MM-DD G
GET box score for Game/boxscore/{gameId}Get 
