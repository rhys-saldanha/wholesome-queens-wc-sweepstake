import { KNOCKOUT_ROUND_SIZES } from "@/lib/rounds";
import type { Fixture } from "@/lib/types";

const FINISHED: Fixture["status"][] = ["FT", "AET", "PEN"];

// The team that has advanced out of a finished knockout fixture -- null if
// the match hasn't concluded (including a draw still awaiting AET/pens).
function winnerTeamId(fixture: Fixture): number | null {
  if (!FINISHED.includes(fixture.status)) return null;
  if (fixture.penaltyWinnerTeamId != null) return fixture.penaltyWinnerTeamId;
  const { goalsHome, goalsAway, homeTeamId, awayTeamId } = fixture;
  if (goalsHome == null || goalsAway == null || goalsHome === goalsAway) return null;
  if (homeTeamId == null || awayTeamId == null) return null;
  return goalsHome > goalsAway ? homeTeamId : awayTeamId;
}

// The team knocked out by a finished knockout fixture -- the semi-final
// losers are who contest the 3rd Place Final.
function loserTeamId(fixture: Fixture): number | null {
  const winner = winnerTeamId(fixture);
  if (winner == null || fixture.homeTeamId == null || fixture.awayTeamId == null) return null;
  return winner === fixture.homeTeamId ? fixture.awayTeamId : fixture.homeTeamId;
}

/**
 * Chronological (kickoff-date) order has no relation to bracket topology --
 * two round-of-32 winners that happen to feed the same round-of-16 match
 * are not necessarily adjacent in the schedule. This reorders each round's
 * real fixtures, working backwards from the last round, so that index i and
 * i+1 within a round always share the same parent match in the next round.
 */
function reorderForBracketTopology(rounds: { round: string; fixtures: Fixture[] }[]): Fixture[][] {
  if (rounds.length === 0) return [];

  const orderedFixtures: Fixture[][] = new Array(rounds.length);
  orderedFixtures[rounds.length - 1] = rounds[rounds.length - 1].fixtures.slice();

  for (let k = rounds.length - 2; k >= 0; k--) {
    const childOrder = orderedFixtures[k + 1];
    const prevFixtures = rounds[k].fixtures;
    const usedIds = new Set<number>();
    const newOrder: Fixture[] = [];

    const feederFor = (teamId: number | null) =>
      teamId == null
        ? undefined
        : prevFixtures.find(
            (pf) => !usedIds.has(pf.id) && (pf.homeTeamId === teamId || pf.awayTeamId === teamId),
          );

    for (const child of childOrder) {
      for (const teamId of [child.homeTeamId, child.awayTeamId]) {
        const feeder = feederFor(teamId);
        if (feeder) {
          newOrder.push(feeder);
          usedIds.add(feeder.id);
        }
      }
    }
    // Matches with no known parent yet (future rounds not fully populated)
    // keep their original relative order, appended at the end.
    for (const pf of prevFixtures) {
      if (!usedIds.has(pf.id)) newOrder.push(pf);
    }
    orderedFixtures[k] = newOrder;
  }

  return orderedFixtures;
}

/**
 * The API only creates a knockout fixture once both teams are actually
 * determined -- so a round can be short of its bracket-defined size (16/8/
 * 4/2/1) even when one side of a missing slot is already known (e.g. a team
 * that just won its Round of 16 match, awaiting its Quarter-final opponent).
 *
 * This pads every knockout round up to its full size with synthetic
 * Fixture entries -- status "NS", `date: null` (no real kickoff time exists
 * yet, so none is invented), and `homeTeamId`/`awayTeamId` set from whichever
 * feeder match (this round's slot [2*i, 2*i+1] in the previous round) has
 * already produced a winner, or null if that feeder hasn't been decided.
 *
 * Synthetic ids are deterministic and negative so they can't collide with
 * real API-Football fixture ids and stay stable across repeated fetches.
 */
export function padKnockoutFixtures(realFixtures: Fixture[]): Fixture[] {
  const roundNames = Object.keys(KNOCKOUT_ROUND_SIZES);

  const byRound = new Map<string, Fixture[]>();
  for (const f of realFixtures) {
    if (!roundNames.includes(f.round)) continue;
    const list = byRound.get(f.round) ?? [];
    list.push(f);
    byRound.set(f.round, list);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  }

  const reordered = reorderForBracketTopology(
    roundNames.map((round) => ({ round, fixtures: byRound.get(round) ?? [] })),
  );

  const rounds: Fixture[][] = [];
  roundNames.forEach((round, roundIndex) => {
    const expectedSize = KNOCKOUT_ROUND_SIZES[round];
    const entries = reordered[roundIndex].slice();
    const prevRound = roundIndex > 0 ? rounds[roundIndex - 1] : null;

    for (let slot = entries.length; slot < expectedSize; slot++) {
      const feederA = prevRound?.[2 * slot];
      const feederB = prevRound?.[2 * slot + 1];
      entries.push({
        id: -(roundIndex * 1000 + slot + 1),
        date: null,
        round,
        status: "NS",
        homeTeamId: feederA ? winnerTeamId(feederA) : null,
        awayTeamId: feederB ? winnerTeamId(feederB) : null,
        goalsHome: null,
        goalsAway: null,
        elapsed: null,
        elapsedExtra: null,
        penaltyWinnerTeamId: null,
      });
    }
    rounds.push(entries);
  });

  // The 3rd Place Final sits outside the champion-progression tree (it's fed
  // by the semi-final *losers*), so it's padded separately here rather than
  // in the loop above.
  const thirdPlace = realFixtures.find((f) => f.round === "3rd Place Final") ?? {
    id: -9001,
    date: null,
    round: "3rd Place Final",
    status: "NS" as const,
    homeTeamId: loserTeamId(rounds[roundNames.indexOf("Semi-finals")][0]),
    awayTeamId: loserTeamId(rounds[roundNames.indexOf("Semi-finals")][1]),
    goalsHome: null,
    goalsAway: null,
    elapsed: null,
    elapsedExtra: null,
    penaltyWinnerTeamId: null,
  };

  return [...rounds.flat(), thirdPlace];
}
