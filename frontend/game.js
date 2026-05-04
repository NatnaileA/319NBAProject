const API_BASE = "http://localhost:8000";

const title = document.getElementById("game-title");
const message = document.getElementById("message");
const boxscore = document.getElementById("boxscore");

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}

function getGameId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("gameId");
}

async function loadBoxScore() {
  const gameId = getGameId();
  if (!gameId) {
    message.textContent = "Missing game id.";
    return;
  }

  try {
    const data = await fetchJson(`${API_BASE}/boxscore/${gameId}`);
    title.textContent = data.name || "Box Score";
    message.textContent = "";
    boxscore.innerHTML = data.teams.map(teamTableHtml).join("");
  } catch (error) {
    message.textContent = "Could not load box score. Make sure the backend is running.";
  }
}

function teamTableHtml(team) {
  return `
    <section class="boxscore-card">
      <div class="team-title">
        ${team.logo ? `<img src="${team.logo}" alt="" />` : ""}
        <h2>${team.name || "Team"}</h2>
      </div>
      <table>
        <thead>
          <tr>
        <th>Player</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>FG%</th>
          </tr>
        </thead>
        <tbody>
          ${team.players.map(player => `
            <tr>
              <td>${player.name || "Player"}</td>
              <td>${player.points}</td>
              <td>${player.rebounds}</td>
              <td>${player.assists}</td>
              <td>${player.fg_pct}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

loadBoxScore();
