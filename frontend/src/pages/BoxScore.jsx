import React from "react";
import { Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import api from "../api";

export default function BoxScore({ user }) {
  const { gameId } = useParams();
  const [boxScore, setBoxScore] = React.useState(null);
  const [favoriteIds, setFavoriteIds] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Load the ESPN box score when this page opens for a game id.
    api
      .get(`/scoreboard/${gameId}/boxscore`)
      .then((response) =>
        setBoxScore({
          ...response.data,
          players: Array.isArray(response.data?.players) ? response.data.players : [],
        }),
      )
      .catch(() => setError("Could not load box score from ESPN."));
  }, [gameId]);

  React.useEffect(() => {
    // Load favorite player ids so saved players have yellow stars.
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    api
      .get("/favorites")
      .then((response) => {
        const playerIds = (Array.isArray(response.data) ? response.data : [])
          .filter((favorite) => favorite.entity_type === "player")
          .map((favorite) => favorite.entity_id);
        setFavoriteIds(playerIds);
      })
      .catch(() => setFavoriteIds([]));
  }, [user]);

  const savePlayer = async (player) => {
    // Toggle favorite status for one player.
    if (favoriteIds.includes(player.id)) {
      await api.delete(`/favorites/player/${player.id}`);
      setFavoriteIds((current) => current.filter((id) => id !== player.id));
      return;
    }

    await api.post("/favorites", {
      entity_type: "player",
      entity_id: player.id,
      entity_name: player.name || `Player ${player.id}`,
    });
    setFavoriteIds((current) => Array.from(new Set([...current, player.id])));
  };

  if (error) {
    return <p className="rounded-md bg-red-950 p-3 text-red-200">{error}</p>;
  }

  if (!boxScore) {
    return <p className="text-zinc-400">Loading box score...</p>;
  }

  return (
    <section>
      <Link className="text-sm text-orange-300 hover:text-orange-200" to="/">
        Back to scoreboard
      </Link>
      <div className="mt-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{boxScore.name || "Box Score"}</h1>
        <p className="mt-1 text-sm text-zinc-400">{boxScore.date && new Date(boxScore.date).toLocaleString()}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right">PTS</th>
              <th className="px-4 py-3 text-right">REB</th>
              <th className="px-4 py-3 text-right">AST</th>
              <th className="px-4 py-3 text-right">PRA</th>
              <th className="px-4 py-3 text-right">FG%</th>
              {user && <th className="px-4 py-3 text-right">Fav</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950">
            {(Array.isArray(boxScore.players) ? boxScore.players : []).map((player, index) => (
              <tr key={`${player.id}-${index}`} className="hover:bg-zinc-900">
                <td className="px-4 py-3 font-medium">{player.name}</td>
                <td className="px-4 py-3 text-zinc-300">{player.team}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.points}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.rebounds}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.assists}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {player.points + player.rebounds + player.assists}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{player.fg_pct}%</td>
                {user && (
                  <td className="px-4 py-3 text-right">
                    <button
                      className={`icon-button ${
                        favoriteIds.includes(player.id) ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-300" : ""
                      }`}
                      onClick={() => savePlayer(player)}
                      title={favoriteIds.includes(player.id) ? "Unfavorite player" : "Favorite player"}
                    >
                      <Star size={16} fill={favoriteIds.includes(player.id) ? "currentColor" : "none"} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
