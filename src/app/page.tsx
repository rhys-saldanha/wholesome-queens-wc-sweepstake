import { getAllFixtures } from "@/lib/api-football/fixtures";
import { getGroupStandings } from "@/lib/api-football/standings";
import { buildLeaderboard } from "@/lib/api-football/leaderboard";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { GroupsGrid } from "@/components/GroupsGrid";
import { KnockoutBracket } from "@/components/KnockoutBracket";
import { RefreshControl } from "@/components/RefreshControl";
import type { Fixture, GroupStanding } from "@/lib/types";

export default async function Home() {
  const [fixturesResult, standingsResult] = await Promise.allSettled([
    getAllFixtures(),
    getGroupStandings(),
  ]);

  const fixtures: Fixture[] = fixturesResult.status === "fulfilled" ? fixturesResult.value : [];
  const groups: GroupStanding[] = standingsResult.status === "fulfilled" ? standingsResult.value : [];
  const hasError = fixturesResult.status === "rejected" || standingsResult.status === "rejected";

  if (hasError) {
    console.error(
      "Live data fetch failed:",
      fixturesResult.status === "rejected" ? fixturesResult.reason : null,
      standingsResult.status === "rejected" ? standingsResult.reason : null,
    );
  }

  const leaderboard = buildLeaderboard(fixtures, groups);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">World Cup 2026 Sweepstake</h1>
          <RefreshControl lastUpdated={new Date().toISOString()} />
        </div>
        <p className="text-sm text-foreground/60">
          6 players, 8 teams each, £10 a head. 🏆 Champion &amp; 🥈 runner-up prizes go to whoever
          drafted the two finalists; the 🥄 wooden spoon goes to the lowest points total.
        </p>
      </header>

      {hasError && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Live scores are temporarily unavailable — showing the last data we could load
          {fixtures.length === 0 && groups.length === 0 ? " (none yet)" : ""}.
        </div>
      )}

      <LeaderboardSection leaderboard={leaderboard} />
      <KnockoutBracket fixtures={fixtures} />
      <GroupsGrid groups={groups} />
    </main>
  );
}
