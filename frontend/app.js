const API_BASE = "http://localhost:8000";
//fdsfdsfsdfs
const dateInput = document.getElementById("game-date");
const gamesContainer = document.getElementById("games");
const favoritesContainer = document.getElementById("favorites");
const message = document.getElementById("message");

// Got rid of the database but can still keep favorites locally
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function loadGames() {
  const selectedDate = dateInput.value;
  message.textContent = "Loading games...";
  gamesContainer.innerHTML = "";

  try {
    const games = await fetchJson(`${API_BASE}/scoreboard?date=${selectedDate}`);
    message.textContent = games.length ? "" : "No games found for this date.";
    gamesContainer.innerHTML = games.map(gameCardHtml).join("");
  } catch (error) {
    message.textContent = "Could not load games. Make sure the backend is running.";
  }
}

function gameCardHtml(game) {
  return `
    <article class="card">
      <div class="card-header">
        <div>
          <strong>${game.status_detail || game.status}</strong>
          <p>${new Date(game.date).toLocaleString()}</p>
        </div>
        <a class="info-button" href="game.html?gameId=${game.id}">i</a>
      </div>
      ${teamRowHtml(game.away)}
      ${teamRowHtml(game.home)}
    </article>
  `;
}

function teamRowHtml(team) {
  const favorites = getFavorites();
  const saved = favorites.some(f => f.team_id === team.id);
  const starClass = saved ? "star-button saved" : "star-button";

  return `
    <div class="team-row">
      <div class="team-left">
        <button class="${starClass}" onclick="toggleFavorite('${team.id}', '${escapeText(team.name)}')">&starf;</button>
        ${team.logo ? `<img src="${team.logo}" alt="" />` : ""}
        <div>
          <strong>${team.name || "Team TBD"}</strong>
          <p>${team.record || ""}</p>
        </div>
      </div>
      <span class="score">${team.score || 0}</span>
    </div>
  `;
}

function toggleFavorite(teamId, teamName) {
  const favorites = getFavorites();
  const index = favorites.findIndex(f => f.team_id === teamId);

  if (index !== -1) {
    favorites.splice(index, 1); // remove
  } else {
    favorites.push({ team_id: teamId, team_name: teamName }); // add
  }

  saveFavorites(favorites);
  renderFavorites();
  loadGames(); // re-render cards so star updates
}

function renderFavorites() {
  const favorites = getFavorites();

  if (!favorites.length) {
    favoritesContainer.innerHTML = `<p class="empty">No favorite teams yet.</p>`;
    return;
  }

  favoritesContainer.innerHTML = `
    <table>
      <thead>
        <tr><th>Team</th><th></th></tr>
      </thead>
      <tbody>
        ${favorites.map(f => `
          <tr>
            <td>${f.team_name}</td>
            <td>
              <button class="trash-button" onclick="toggleFavorite('${f.team_id}', '${escapeText(f.team_name)}')">&times;</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function escapeText(value) {
  return String(value || "").replaceAll("'", "\\'");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

dateInput.value = todayDate();
dateInput.addEventListener("change", loadGames);

renderFavorites();
loadGames();