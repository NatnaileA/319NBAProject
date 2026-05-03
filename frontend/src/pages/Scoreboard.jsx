import React from "react";
import { ExternalLink, Trash2, X } from "lucide-react";

import api from "../api";
import GameCard from "../components/GameCard";

function todayInputValue() {
  // Date input expects YYYY-MM-DD.
  return new Date().toISOString().slice(0, 10);
}

function FavoritesTable({ favorites, loadingStats, onOpenPlayer, onRemove, playerStats, selectedPlayer, onCloseStats }) {
  const recentGames = Array.isArray(playerStats?.games) ? playerStats.games.slice(0, 5) : [];
  const recentTotals = recentGames.reduce(
    (totals, game) => ({
      points: totals.points + Number(game.points || 0),
      rebounds: totals.rebounds + Number(game.rebounds || 0),
      assists: totals.assists + Number(game.assists || 0),
    }),
    { points: 0, rebounds: 0, assists: 0 },
  );
  const recentCount = recentGames.length || 1;
  const recentAverages = {
    ppg: (recentTotals.points / recentCount).toFixed(1),
    rpg: (recentTotals.rebounds / recentCount).toFixed(1),
    apg: (recentTotals.assists / recentCount).toFixed(1),
  };

  // This table lives beside the scoreboard and is only shown after login.
  if (!Array.isArray(favorites) || favorites.length === 0) {
    return (
      <aside className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold">Favorites</h2>
        <p className="mt-2 text-sm text-zinc-400">Star teams or players to add them here.</p>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold">Favorites</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {favorites.map((favorite) => (
              <tr key={favorite.id}>
                <td className="px-4 py-3 capitalize text-zinc-400">{favorite.entity_type}</td>
                <td className="px-4 py-3">
                  {favorite.entity_type === "player" ? (
                    <button
                      className="text-left font-medium text-orange-300 hover:text-orange-200"
                      onClick={() => onOpenPlayer(favorite)}
                    >
                      {favorite.entity_name || favorite.entity_id}
                    </button>
                  ) : (
                    <span className="font-medium">{favorite.entity_name || favorite.entity_id}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="icon-button" onClick={() => onRemove(favorite.id)} title="Remove favorite">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPlayer && (
        <div className="max-h-[520px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selectedPlayer.entity_name}</h3>
              <p className="text-xs text-zinc-500">Playoff stats</p>
            </div>
            <button className="icon-button" onClick={onCloseStats} title="Close stats">
              <X size={16} />
            </button>
          </div>

          {loadingStats && <p className="text-sm text-zinc-400">Loading player stats...</p>}

          {!loadingStats && playerStats && (
            <div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md bg-zinc-800 p-2">
                  <div className="text-zinc-500">Shown</div>
                  <div className="font-semibold">{recentGames.length}</div>
                </div>
                <div className="rounded-md bg-zinc-800 p-2">
                  <div className="text-zinc-500">Last 5 PPG</div>
                  <div className="font-semibold">{recentAverages.ppg}</div>
                </div>
                <div className="rounded-md bg-zinc-800 p-2">
                  <div className="text-zinc-500">RPG / APG</div>
                  <div className="font-semibold">
                    {recentAverages.rpg} / {recentAverages.apg}
                  </div>
                </div>
              </div>

              {recentGames.length > 0 ? (
                <div className="mt-3 max-h-56 overflow-auto rounded-md border border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 text-zinc-500">
                      <tr>
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Opp</th>
                        <th className="px-2 py-2 text-right">PTS</th>
                        <th className="px-2 py-2 text-right">REB</th>
                        <th className="px-2 py-2 text-right">AST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {recentGames.map((game, index) => (
                        <tr key={`${game.date}-${index}`}>
                          <td className="px-2 py-2">{game.date || "-"}</td>
                          <td className="px-2 py-2">{game.opponent || "-"}</td>
                          <td className="px-2 py-2 text-right">{game.points}</td>
                          <td className="px-2 py-2 text-right">{game.rebounds}</td>
                          <td className="px-2 py-2 text-right">{game.assists}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">No ESPN playoff gamelog rows found yet.</p>
              )}

              <a
                className="mt-3 inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200"
                href={playerStats.espn_url}
                target="_blank"
                rel="noreferrer"
              >
                Open ESPN gamelog
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default function Scoreboard({ user }) {
  const [games, setGames] = React.useState([]);
  const [favorites, setFavorites] = React.useState([]);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [playerStats, setPlayerStats] = React.useState(null);
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(todayInputValue);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadGames = async (date = selectedDate) => {
    // Date changes automatically call this and fetch fresh ESPN games.
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/scoreboard", { params: { date } });
      setGames(Array.isArray(response.data) ? response.data : []);
    } catch {
      setGames([]);
      setError("Could not load games from ESPN. Make sure the backend is running, then try another date.");
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    // Favorites come from PostgreSQL and belong to the logged-in user.
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const response = await api.get("/favorites");
      setFavorites(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFavorites([]);
    }
  };

  React.useEffect(() => {
    // Reload games every time the selected date changes.
    loadGames(selectedDate);
  }, [selectedDate]);

  React.useEffect(() => {
    // Reload favorites when login state changes.
    loadFavorites();
  }, [user]);

  const removeFavorite = async (favoriteId) => {
    // Trash button removes by favorite table id.
    await api.delete(`/favorites/${favoriteId}`);
    await loadFavorites();
  };

  const openPlayerStats = async (favorite) => {
    // Clicking a favorite player fetches that player's playoff gamelog.
    setSelectedPlayer(favorite);
    setPlayerStats(null);
    setLoadingStats(true);
    try {
      const response = await api.get(`/scoreboard/players/${favorite.entity_id}/playoff-stats`);
      setPlayerStats(response.data);
    } catch {
      setPlayerStats({
        games: [],
        totals: { games: 0, points: 0, rebounds: 0, assists: 0, pra: 0, ppg: 0, rpg: 0, apg: 0 },
        espn_url: `https://www.espn.com/nba/player/gamelog/_/id/${favorite.entity_id}`,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scoreboard</h1>
          <p className="mt-1 text-sm text-zinc-400">Pick any date to see the teams, scores, and box-score details.</p>
        </div>
        <input
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      {loading && <p className="text-zinc-400">Loading games...</p>}
      {error && <p className="rounded-md bg-red-950 p-3 text-red-200">{error}</p>}
      {!loading && !error && Array.isArray(games) && games.length === 0 && (
        <p className="text-zinc-400">No NBA playoff games found for {selectedDate}.</p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid auto-rows-max items-start gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {(Array.isArray(games) ? games : []).map((game) => (
            <GameCard
              key={game.id}
              favorites={favorites}
              game={game}
              user={user}
              onFavoriteSaved={loadFavorites}
            />
          ))}
        </div>

        {user && (
          <FavoritesTable
            favorites={favorites}
            loadingStats={loadingStats}
            onCloseStats={() => {
              setSelectedPlayer(null);
              setPlayerStats(null);
            }}
            onOpenPlayer={openPlayerStats}
            onRemove={removeFavorite}
            playerStats={playerStats}
            selectedPlayer={selectedPlayer}
          />
        )}
      </div>
    </section>
  );
}
