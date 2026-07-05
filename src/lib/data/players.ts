import sweepstake from "@/data/sweepstake.json";
import type { Player } from "@/lib/types";

export const PLAYER_LIST: Player[] = sweepstake.players as Player[];

export const PLAYERS: Record<string, Player> = Object.fromEntries(
  PLAYER_LIST.map((player) => [player.colour, player]),
);

const TEAM_ID_TO_PLAYER = new Map<number, Player>();
for (const player of PLAYER_LIST) {
  for (const team of player.teams) {
    TEAM_ID_TO_PLAYER.set(team.apiFootballId, player);
  }
}

export function findPlayerByTeamId(teamId: number | null): Player | undefined {
  return teamId == null ? undefined : TEAM_ID_TO_PLAYER.get(teamId);
}

// Fails fast at startup if the data file has a duplicate/missing team.
const ALL_TEAM_IDS = PLAYER_LIST.flatMap((p) => p.teams.map((t) => t.apiFootballId));
if (new Set(ALL_TEAM_IDS).size !== ALL_TEAM_IDS.length) {
  throw new Error("Duplicate apiFootballId found across players in sweepstake.json");
}
if (ALL_TEAM_IDS.length !== 48) {
  throw new Error(`Expected 48 teams across all players, found ${ALL_TEAM_IDS.length}`);
}
