import { PLAYER_LIST, findPlayerByTeamId } from "./players";
import type { Team } from "@/lib/types";

const TEAM_BY_ID = new Map<number, Team>();
for (const player of PLAYER_LIST) {
  for (const team of player.teams) {
    TEAM_BY_ID.set(team.apiFootballId, team);
  }
}

export interface ResolvedTeam {
  apiFootballId: number | null;
  abbreviation: string;
  name: string;
  hexColour: string | null;
}

export function resolveTeam(teamId: number | null): ResolvedTeam {
  if (teamId == null) {
    return { apiFootballId: null, abbreviation: "TBD", name: "TBD", hexColour: null };
  }
  const team = TEAM_BY_ID.get(teamId);
  const player = findPlayerByTeamId(teamId);
  return {
    apiFootballId: teamId,
    abbreviation: team?.abbreviation ?? "???",
    name: team?.name ?? `Unknown (${teamId})`,
    hexColour: player?.hexColour ?? null,
  };
}
