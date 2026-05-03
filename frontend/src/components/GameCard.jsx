import React from "react";
import { Link } from "react-router-dom";
import { Info, Star } from "lucide-react";

import api from "../api";

function TeamRow({ isFavorite, onToggleFavorite, team, user }) {
  // A single team row shows favorite star, logo, name, record, and score.
  const safeTeam = team || {};

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {user && (
          <button
            className={`icon-button shrink-0 ${isFavorite ? "bg-yellow-400 text-zinc-950 hover:bg-yellow-300" : ""}`}
            onClick={() => onToggleFavorite(safeTeam)}
            title={isFavorite ? "Unfavorite team" : "Favorite team"}
          >
            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
        {safeTeam.logo && <img className="h-8 w-8 object-contain" src={safeTeam.logo} alt="" />}
        <div className="min-w-0">
          <div className="truncate font-semibold">{safeTeam.display_name || "Team TBD"}</div>
          <div className="text-xs text-zinc-400">{safeTeam.record || "Record unavailable"}</div>
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums">{safeTeam.score ?? 0}</div>
    </div>
  );
}

export default function GameCard({ favorites = [], game, user, onFavoriteSaved }) {
  const [saving, setSaving] = React.useState(false);

  // Find whether this team is already saved so the star can turn yellow.
  const favoriteForTeam = (team) =>
    favorites.find((favorite) => favorite.entity_type === "team" && favorite.entity_id === team?.id);

  const toggleTeamFavorite = async (team) => {
    // Same button handles add and remove depending on current favorite state.
    if (!team?.id || saving) {
      return;
    }

    setSaving(true);
    try {
      const existing = favoriteForTeam(team);
      if (existing) {
        await api.delete(`/favorites/${existing.id}`);
      } else {
        await api.post("/favorites", {
          entity_type: "team",
          entity_id: team.id,
          entity_name: team.display_name || team.abbreviation || `Team ${team.id}`,
        });
      }
      await onFavoriteSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const gameDate = game?.date ? new Date(game.date).toLocaleString() : "Date unavailable";

  return (
    <article className="self-start rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">
            {game?.status?.detail || game?.status?.description || "Game status unavailable"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{gameDate}</div>
        </div>
        <Link
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-orange-500 text-zinc-950 hover:bg-orange-400"
          to={`/games/${game.id}`}
          title="Game info"
        >
          <Info size={18} />
        </Link>
      </div>

      <div className="space-y-3">
        <TeamRow
          isFavorite={Boolean(favoriteForTeam(game?.away))}
          onToggleFavorite={toggleTeamFavorite}
          team={game?.away}
          user={user}
        />
        <TeamRow
          isFavorite={Boolean(favoriteForTeam(game?.home))}
          onToggleFavorite={toggleTeamFavorite}
          team={game?.home}
          user={user}
        />
      </div>
    </article>
  );
}
