import { apiFootballGet, getStandingsRevalidateSeconds, LEAGUE_ID, SEASON } from "./client";
import { StandingsResponseSchema } from "./schemas";
import type { GroupStanding } from "@/lib/types";

// API-Football's /standings response includes a non-lettered pseudo-group
// (literally named "Group Stage") listing the best third-placed teams
// across all groups for knockout qualification purposes. We only want the
// real lettered groups (A-L) for the group tables.
function isLetteredGroup(groupName: string): boolean {
  return /^Group [A-Z]$/.test(groupName);
}

export async function getGroupStandings(): Promise<GroupStanding[]> {
  const raw = await apiFootballGet(
    `/standings?league=${LEAGUE_ID}&season=${SEASON}`,
    getStandingsRevalidateSeconds(),
  );
  const parsed = StandingsResponseSchema.parse(raw);

  const league = parsed.response[0];
  if (!league) return [];

  return league.league.standings
    .filter((rows) => rows.length > 0 && isLetteredGroup(rows[0].group))
    .map((rows) => ({
      group: rows[0].group,
      rows: rows.map((row) => ({
        teamId: row.team.id,
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        goalsDiff: row.goalsDiff,
        points: row.points,
      })),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}
