"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { TeamChip } from "./TeamChip";
import { Countdown } from "./Countdown";
import { resolveTeam } from "@/lib/data/team-lookup";
import { KNOCKOUT_ROUND_ORDER } from "@/lib/rounds";
import type { Fixture } from "@/lib/types";

const FINISHED: Fixture["status"][] = ["FT", "AET", "PEN"];
const MIN_ROW_HEIGHT = 88;
const COLUMN_WIDTH = 224;
const COLUMN_GAP = 56;

function statusLabel(fixture: Fixture): { text: string | null; live: boolean } {
  switch (fixture.status) {
    case "NS":
      return { text: null, live: false }; // rendered as a live countdown instead
    case "FT":
      return { text: "FT", live: false };
    case "AET":
      return { text: "FT (AET)", live: false };
    case "PEN":
      return { text: "FT (penalties)", live: false };
    case "PST":
    case "CANC":
    case "ABD":
      return { text: fixture.status, live: false };
    default:
      return { text: "LIVE", live: true };
  }
}

function MatchCard({ fixture }: { fixture: Fixture }) {
  const home = resolveTeam(fixture.homeTeamId);
  const away = resolveTeam(fixture.awayTeamId);
  const { text, live } = statusLabel(fixture);
  const played = fixture.goalsHome != null && fixture.goalsAway != null;

  return (
    <div
      className="flex w-56 flex-col gap-1 rounded-md border-2 border-foreground/10 bg-background px-3 py-2 text-sm"
      role="group"
      aria-label={`${home.name} vs ${away.name}`}
    >
      <div className="flex items-center justify-between gap-2">
        <TeamChip abbreviation={home.abbreviation} name={home.name} hexColour={home.hexColour} size="sm" />
        {played && <span className="tabular-nums font-semibold">{fixture.goalsHome}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <TeamChip abbreviation={away.abbreviation} name={away.name} hexColour={away.hexColour} size="sm" />
        {played && <span className="tabular-nums font-semibold">{fixture.goalsAway}</span>}
      </div>
      <span
        className={`self-start rounded px-1 text-xs font-medium tabular-nums ${
          live ? "bg-red-500/15 text-red-500" : "text-foreground/40"
        }`}
      >
        {fixture.status === "NS" ? <Countdown targetDate={fixture.date} /> : text}
      </span>
    </div>
  );
}

interface RoundInfo {
  round: string;
  originalIndex: number;
  fixtures: Fixture[];
}

/**
 * Chronological (kickoff-date) order has no relation to bracket topology --
 * two round-of-32 winners that happen to feed the same round-of-16 match
 * are not necessarily adjacent in the schedule. This reorders each round's
 * fixtures, working backwards from the last round, so that index i and i+1
 * within a round always share the same parent match in the next round --
 * which is what makes the simple `rowStart = i * span` grid math (and the
 * connector lines it drives) actually reflect who plays whom.
 */
function reorderForBracketTopology(rounds: RoundInfo[]): RoundInfo[] {
  if (rounds.length === 0) return rounds;

  const orderedFixtures: Fixture[][] = new Array(rounds.length);
  orderedFixtures[rounds.length - 1] = rounds[rounds.length - 1].fixtures.slice();

  for (let k = rounds.length - 2; k >= 0; k--) {
    const childOrder = orderedFixtures[k + 1];
    const prevFixtures = rounds[k].fixtures;
    const usedIds = new Set<number>();
    const newOrder: Fixture[] = [];

    const feederFor = (teamId: number) =>
      prevFixtures.find(
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

  return rounds.map((r, k) => ({ ...r, fixtures: orderedFixtures[k] }));
}

interface SlotLayout {
  rowStart: number;
  span: number;
}

/**
 * Row placement sized to whatever's actually rendered, not the round's
 * theoretical depth in a full 32-team bracket -- e.g. a single Quarter-final
 * fixture takes up just enough space for its two real Round of 16 feeders,
 * not a fixed quarter of the whole grid, so trimmed ("recent") views don't
 * reserve tall empty gaps for rounds/matches that aren't shown or don't
 * exist yet.
 */
function computeSlotLayout(rounds: RoundInfo[]): { layout: Map<number, SlotLayout>; baseRows: number } {
  const layout = new Map<number, SlotLayout>();
  if (rounds.length === 0) return { layout, baseRows: 0 };

  rounds[0].fixtures.forEach((fixture, i) => {
    layout.set(fixture.id, { rowStart: i + 1, span: 1 });
  });

  for (let k = 1; k < rounds.length; k++) {
    const prevFixtures = rounds[k - 1].fixtures;
    let cursor = 1;

    for (const fixture of rounds[k].fixtures) {
      const feederIds = [fixture.homeTeamId, fixture.awayTeamId]
        .map((teamId) => prevFixtures.find((pf) => pf.homeTeamId === teamId || pf.awayTeamId === teamId))
        .filter((pf): pf is Fixture => pf != null)
        .map((pf) => layout.get(pf.id))
        .filter((entry): entry is SlotLayout => entry != null);

      let rowStart: number;
      let span: number;
      if (feederIds.length > 0) {
        rowStart = Math.min(...feederIds.map((f) => f.rowStart));
        span = feederIds.reduce((sum, f) => sum + f.span, 0);
      } else {
        rowStart = cursor;
        span = 2;
      }
      layout.set(fixture.id, { rowStart, span });
      cursor = Math.max(cursor, rowStart + span);
    }
  }

  const baseRows = Math.max(
    ...Array.from(layout.values()).map((l) => l.rowStart + l.span - 1),
  );
  return { layout, baseRows };
}

function BracketGrid({ rounds }: { rounds: RoundInfo[] }) {
  // Row 1 is a dedicated header row (rather than overlapping row 1 of the
  // matches via a negative offset) -- an `overflow-x-auto` container also
  // forces `overflow-y` to clip, so anything positioned above the grid's
  // own top edge would otherwise get cut off instead of scrolling into view.
  const HEADER_ROW_HEIGHT = 28;
  const { layout, baseRows } = useMemo(() => computeSlotLayout(rounds), [rounds]);

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid"
        style={
          {
            gridTemplateColumns: `repeat(${rounds.length}, ${COLUMN_WIDTH}px)`,
            gridTemplateRows: `${HEADER_ROW_HEIGHT}px repeat(${baseRows}, minmax(${MIN_ROW_HEIGHT}px, 1fr))`,
            height: HEADER_ROW_HEIGHT + baseRows * MIN_ROW_HEIGHT,
            columnGap: COLUMN_GAP,
          } as CSSProperties
        }
      >
        {rounds.map(({ round }, visibleIdx) => (
          <h3
            key={round}
            id={`round-${round.replace(/\s+/g, "-").toLowerCase()}`}
            className="self-center text-sm font-semibold text-foreground/70"
            style={{ gridColumn: visibleIdx + 1, gridRow: 1 }}
          >
            {round}
          </h3>
        ))}
        {rounds.map(({ round, fixtures }, visibleIdx) => {
          const headingId = `round-${round.replace(/\s+/g, "-").toLowerCase()}`;
          return fixtures.map((fixture) => {
            const { rowStart, span } = layout.get(fixture.id)!;
            return (
              <div
                key={fixture.id}
                className="bracket-slot"
                style={{
                  gridColumn: visibleIdx + 1,
                  gridRow: `${rowStart + 1} / span ${span}`,
                }}
                aria-labelledby={headingId}
              >
                <MatchCard fixture={fixture} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

export function KnockoutBracket({ fixtures }: { fixtures: Fixture[] }) {
  const [view, setView] = useState<"recent" | "full">("recent");

  const { fullRounds, thirdPlace, recentStartIndex } = useMemo(() => {
    const knockoutFixtures = fixtures.filter((f) =>
      (KNOCKOUT_ROUND_ORDER as readonly string[]).includes(f.round),
    );

    const byRound = new Map<string, Fixture[]>();
    for (const fixture of knockoutFixtures) {
      const list = byRound.get(fixture.round) ?? [];
      list.push(fixture);
      byRound.set(fixture.round, list);
    }
    for (const list of byRound.values()) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }

    // The 3rd Place Final isn't part of the champion-progression bracket
    // (it's fed by the two semi-final losers, not winners), so it's kept
    // separate rather than breaking the bracket's power-of-two layout.
    const roundNames = KNOCKOUT_ROUND_ORDER.filter((r) => r !== "3rd Place Final" && byRound.has(r));
    const fullRounds: RoundInfo[] = reorderForBracketTopology(
      roundNames.map((round, originalIndex) => ({
        round,
        originalIndex,
        fixtures: byRound.get(round)!,
      })),
    );
    const thirdPlace = byRound.get("3rd Place Final")?.[0];

    // "Recent" trims off already-finished rounds, starting from whichever
    // round is currently active -- the earliest round that still has an
    // unfinished match -- through to the end (including future rounds).
    // Falls back to the last round once everything's finished.
    const activeIndex = fullRounds.findIndex((r) => r.fixtures.some((f) => !FINISHED.includes(f.status)));
    const recentStartIndex = activeIndex === -1 ? fullRounds.length - 1 : activeIndex;

    return { fullRounds, thirdPlace, recentStartIndex };
  }, [fixtures]);

  if (fullRounds.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Knockout stage</h2>
        <p className="text-sm text-foreground/60">Knockout fixtures haven&apos;t been scheduled yet.</p>
      </section>
    );
  }

  const visibleRounds = view === "full" ? fullRounds : fullRounds.slice(recentStartIndex);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Knockout stage</h2>
        <div className="inline-flex rounded-md border border-foreground/20 p-0.5 text-xs font-medium">
          {(["recent", "full"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`rounded px-2.5 py-1 capitalize ${
                view === mode ? "bg-foreground/10" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <BracketGrid rounds={visibleRounds} />

      {thirdPlace && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground/70">3rd Place Play-off</h3>
          <MatchCard fixture={thirdPlace} />
        </div>
      )}
    </section>
  );
}
