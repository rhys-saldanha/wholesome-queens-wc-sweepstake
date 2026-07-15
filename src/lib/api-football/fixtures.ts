import { apiFootballGet, getFixturesRevalidateSeconds, LEAGUE_ID, SEASON } from "./client";
import { padKnockoutFixtures } from "./knockout-bracket";
import { KNOCKOUT_ROUND_ORDER } from "@/lib/rounds";
import { FixturesResponseSchema } from "./schemas";
import type { Fixture } from "@/lib/types";

export async function getAllFixtures(): Promise<Fixture[]> {
  const raw = await apiFootballGet(
    `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    getFixturesRevalidateSeconds(),
  );
  const parsed = FixturesResponseSchema.parse(raw);

  const fixtures = parsed.response.map((item): Fixture => {
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
      elapsed: item.fixture.status.elapsed,
      elapsedExtra: item.fixture.status.extra ?? null,
      penaltyWinnerTeamId,
    };
  });

  const knockoutRoundNames = KNOCKOUT_ROUND_ORDER as readonly string[];
  const otherFixtures = fixtures.filter((f) => !knockoutRoundNames.includes(f.round));
  const knockoutFixtures = fixtures.filter((f) => knockoutRoundNames.includes(f.round));

  return [...otherFixtures, ...padKnockoutFixtures(knockoutFixtures)];
}
