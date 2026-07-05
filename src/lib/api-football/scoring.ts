import type { Fixture, TeamRecord } from "@/lib/types";

const NOT_STARTED: Fixture["status"][] = ["NS", "PST", "CANC", "ABD", "AWD", "WO"];

export function computeTeamRecord(teamId: number, fixtures: Fixture[]): TeamRecord {
  const record: TeamRecord = { played: 0, wins: 0, draws: 0, losses: 0, points: 0 };

  for (const fixture of fixtures) {
    if (fixture.homeTeamId !== teamId && fixture.awayTeamId !== teamId) continue;
    if (NOT_STARTED.includes(fixture.status)) continue;

    const isHome = fixture.homeTeamId === teamId;
    const goalsFor = (isHome ? fixture.goalsHome : fixture.goalsAway) ?? 0;
    const goalsAgainst = (isHome ? fixture.goalsAway : fixture.goalsHome) ?? 0;

    record.played += 1;

    // A shootout winner (fixture.penaltyWinnerTeamId) decides the match
    // outright as a full win, even though normal/extra-time goals are level.
    if (fixture.penaltyWinnerTeamId != null) {
      if (fixture.penaltyWinnerTeamId === teamId) {
        record.wins += 1;
        record.points += 2;
      } else {
        record.losses += 1;
      }
      continue;
    }

    if (goalsFor > goalsAgainst) {
      record.wins += 1;
      record.points += 2;
    } else if (goalsFor === goalsAgainst) {
      // Covers genuine full-time draws and matches still level in a live
      // shootout (status "P", not yet decided) -- both count as a
      // provisional draw until a penalty winner is reported.
      record.draws += 1;
      record.points += 1;
    } else {
      record.losses += 1;
    }
  }

  return record;
}
