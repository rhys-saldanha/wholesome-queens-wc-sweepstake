import { PLAYER_LIST, findPlayerByTeamId } from "@/lib/data/players";
import { computeTeamRecord } from "./scoring";
import { computeEliminatedTeamIds } from "./elimination";
import type { Fixture, GroupStanding, Leaderboard, LeaderboardEntry } from "@/lib/types";

function findFinalResult(fixtures: Fixture[]): { winnerTeamId: number; loserTeamId: number } | null {
  const final = fixtures.find((f) => f.round === "Final");
  if (!final) return null;

  const finished = ["FT", "AET", "PEN"].includes(final.status);
  if (!finished) return null;
  if (final.homeTeamId == null || final.awayTeamId == null) return null;

  const homeGoals = final.goalsHome ?? 0;
  const awayGoals = final.goalsAway ?? 0;

  let winnerTeamId: number;
  let loserTeamId: number;
  if (final.penaltyWinnerTeamId != null) {
    winnerTeamId = final.penaltyWinnerTeamId;
    loserTeamId = winnerTeamId === final.homeTeamId ? final.awayTeamId : final.homeTeamId;
  } else if (homeGoals !== awayGoals) {
    winnerTeamId = homeGoals > awayGoals ? final.homeTeamId : final.awayTeamId;
    loserTeamId = homeGoals > awayGoals ? final.awayTeamId : final.homeTeamId;
  } else {
    // Final finished level with no shootout winner reported yet -- treat as unresolved.
    return null;
  }

  return { winnerTeamId, loserTeamId };
}

export function buildLeaderboard(fixtures: Fixture[], groups: GroupStanding[]): Leaderboard {
  const eliminatedTeamIds = computeEliminatedTeamIds(fixtures, groups);

  const entries: LeaderboardEntry[] = PLAYER_LIST.map((player) => {
    const teamRecords = player.teams.map((team) => ({
      ...team,
      record: computeTeamRecord(team.apiFootballId, fixtures),
      eliminated: eliminatedTeamIds.has(team.apiFootballId),
    }));
    const totalPoints = teamRecords.reduce((sum, t) => sum + t.record.points, 0);
    const teamsRemaining = teamRecords.filter((t) => !t.eliminated).length;

    return {
      colour: player.colour,
      displayName: player.displayName,
      hexColour: player.hexColour,
      teamRecords,
      totalPoints,
      teamsRemaining,
      prizes: [],
    };
  });

  // Finalist prizes: whoever drafted the champion/runner-up, independent of points.
  const finalResult = findFinalResult(fixtures);
  const finalStatus: Leaderboard["finalStatus"] = finalResult ? "finished" : "not_played";

  if (finalResult) {
    const champion = findPlayerByTeamId(finalResult.winnerTeamId);
    const runnerUp = findPlayerByTeamId(finalResult.loserTeamId);

    const championEntry = entries.find((e) => e.colour === champion?.colour);
    if (championEntry) {
      championEntry.prizes.push({ kind: "champion", amount: 30 });
    }
    const runnerUpEntry = entries.find((e) => e.colour === runnerUp?.colour);
    if (runnerUpEntry) {
      runnerUpEntry.prizes.push({ kind: "runnerUp", amount: 20 });
    }
  }

  // Wooden spoon: lowest total points, shared if tied.
  const lowestPoints = Math.min(...entries.map((e) => e.totalPoints));
  const lowestEntries = entries.filter((e) => e.totalPoints === lowestPoints);
  const shared = lowestEntries.length > 1;
  for (const entry of lowestEntries) {
    entry.prizes.push({ kind: "woodenSpoon", amount: 10, shared });
  }

  // Lowest points first -- this ordering is about the wooden spoon race,
  // so whoever is currently most at risk of it sits at the top. Ties are
  // broken by fewest teams still in, since fewer teams left means less
  // chance to climb away from the bottom.
  entries.sort((a, b) => a.totalPoints - b.totalPoints || a.teamsRemaining - b.teamsRemaining);

  return { entries, finalStatus };
}
