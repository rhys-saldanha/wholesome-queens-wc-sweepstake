import { apiFootballGet, getRevalidateSeconds, LEAGUE_ID, SEASON } from "./client";
import { FixturesResponseSchema } from "./schemas";
import type { Fixture } from "@/lib/types";

export async function getAllFixtures(): Promise<Fixture[]> {
  const raw = await apiFootballGet(
    `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    getRevalidateSeconds(),
  );
  const parsed = FixturesResponseSchema.parse(raw);

  return parsed.response.map((item): Fixture => {
    const { home, away } = item.teams;
    let penaltyWinnerTeamId: number | null = null;
    if (home.winner === true) penaltyWinnerTeamId = home.id;
    else if (away.winner === true) penaltyWinnerTeamId = away.id;

    return {
      id: item.fixture.id,
      date: item.fixture.date,
      round: item.league.round,
      status: item.fixture.status.short,
      homeTeamId: home.id,
      awayTeamId: away.id,
      goalsHome: item.goals.home,
      goalsAway: item.goals.away,
      penaltyWinnerTeamId,
    };
  });
}
