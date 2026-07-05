import { KNOCKOUT_ROUND_ORDER } from "@/lib/rounds";
import type { Fixture, GroupStanding } from "@/lib/types";

const FINISHED: Fixture["status"][] = ["FT", "AET", "PEN"];

/**
 * A team is eliminated if it has lost a finished knockout match (single
 * elimination, so a loss ends its run), or its group stage has fully
 * concluded (every team in the group has played all 3 matches) and it
 * never showed up in a Round of 32 fixture (i.e. it didn't qualify).
 */
export function computeEliminatedTeamIds(
  fixtures: Fixture[],
  groups: GroupStanding[],
): Set<number> {
  const eliminated = new Set<number>();

  const knockoutFixtures = fixtures.filter((f) =>
    (KNOCKOUT_ROUND_ORDER as readonly string[]).includes(f.round),
  );

  const teamsInKnockouts = new Set<number>();
  for (const f of knockoutFixtures) {
    if (f.homeTeamId != null) teamsInKnockouts.add(f.homeTeamId);
    if (f.awayTeamId != null) teamsInKnockouts.add(f.awayTeamId);
  }

  for (const f of knockoutFixtures) {
    if (!FINISHED.includes(f.status)) continue;
    if (f.homeTeamId == null || f.awayTeamId == null) continue;

    const homeGoals = f.goalsHome ?? 0;
    const awayGoals = f.goalsAway ?? 0;

    let loserTeamId: number | null = null;
    if (f.penaltyWinnerTeamId != null) {
      loserTeamId = f.penaltyWinnerTeamId === f.homeTeamId ? f.awayTeamId : f.homeTeamId;
    } else if (homeGoals !== awayGoals) {
      loserTeamId = homeGoals > awayGoals ? f.awayTeamId : f.homeTeamId;
    }

    if (loserTeamId != null) eliminated.add(loserTeamId);
  }

  for (const group of groups) {
    const groupFinished = group.rows.every((row) => row.played >= 3);
    if (!groupFinished) continue;
    for (const row of group.rows) {
      if (!teamsInKnockouts.has(row.teamId)) {
        eliminated.add(row.teamId);
      }
    }
  }

  return eliminated;
}
