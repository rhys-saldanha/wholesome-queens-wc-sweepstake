import type { CSSProperties } from "react";
import { TeamChip } from "./TeamChip";
import { Countdown } from "./Countdown";
import { resolveTeam } from "@/lib/data/team-lookup";
import { KNOCKOUT_ROUND_ORDER, KNOCKOUT_ROUND_SIZES } from "@/lib/rounds";
import type { Fixture } from "@/lib/types";

const FINISHED: Fixture["status"][] = ["FT", "AET", "PEN"];

// The API only creates a fixture once both teams are actually determined,
// so rounds/matches further out than that don't exist server-side yet.
// These are the publicly published World Cup 2026 knockout dates, used only
// as a countdown target for placeholder ("TBD vs TBD") slots -- cosmetic,
// not used anywhere in scoring.
const ESTIMATED_ROUND_DATE: Record<string, string> = {
  "Quarter-finals": "2026-07-10T18:00:00Z",
  "Semi-finals": "2026-07-15T18:00:00Z",
  Final: "2026-07-19T18:00:00Z",
};

type BracketEntry =
  | { kind: "real"; id: number; fixture: Fixture }
  | { kind: "placeholder"; id: string; round: string };

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

function MatchCard({ entry }: { entry: BracketEntry }) {
  if (entry.kind === "placeholder") {
    const targetDate = ESTIMATED_ROUND_DATE[entry.round] ?? ESTIMATED_ROUND_DATE.Final;
    return (
      <div
        className="bracket-match-card flex w-56 flex-col gap-1 rounded-md border-2 border-dashed border-foreground/10 bg-background px-3 py-2 text-sm"
        role="group"
        aria-label="Teams to be determined"
      >
        <div className="flex items-center justify-between gap-2">
          <TeamChip abbreviation="TBD" name="To be determined" hexColour={null} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <TeamChip abbreviation="TBD" name="To be determined" hexColour={null} size="sm" />
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 self-start rounded px-1 text-xs font-medium tabular-nums text-foreground/40">
          <Countdown targetDate={targetDate} />
        </span>
      </div>
    );
  }

  const { fixture } = entry;
  const home = resolveTeam(fixture.homeTeamId);
  const away = resolveTeam(fixture.awayTeamId);
  const { text, live } = statusLabel(fixture);
  const played = fixture.goalsHome != null && fixture.goalsAway != null;

  return (
    <div
      className="bracket-match-card flex w-56 flex-col gap-1 rounded-md border-2 border-foreground/10 bg-background px-3 py-2 text-sm"
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
        className={`inline-flex w-fit items-center gap-1.5 self-start rounded px-1 text-xs font-medium tabular-nums ${
          live ? "bg-red-500/15 text-red-500" : "text-foreground/40"
        }`}
      >
        {live && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
        {fixture.status === "NS" ? <Countdown targetDate={fixture.date} /> : text}
      </span>
    </div>
  );
}

interface RoundInfo {
  round: string;
  entries: BracketEntry[];
}

/**
 * Chronological (kickoff-date) order has no relation to bracket topology --
 * two round-of-32 winners that happen to feed the same round-of-16 match
 * are not necessarily adjacent in the schedule. This reorders each round's
 * real fixtures, working backwards from the last round, so that index i and
 * i+1 within a round always share the same parent match in the next round.
 * Only operates on real (API-provided) fixtures -- padding with TBD
 * placeholders up to each round's expected size happens afterwards.
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

  return orderedFixtures;
}

// Rough height of one match card (including its gap to the next) -- used
// only to cap column height at roughly the current round's own size, so
// columns with more matches (typically earlier, bigger rounds) require a
// deliberate vertical scroll rather than dictating everyone else's height.
const CARD_HEIGHT_ESTIMATE = 96;
const HEADING_HEIGHT_ESTIMATE = 32;

/**
 * Each round is its own independently-sized column, capped at roughly the
 * current round's height -- that's what forces a vertical scroll to see
 * the rest of a taller (earlier) round, rather than every column matching
 * whichever round happens to have the most matches.
 */
function RoundColumn({
  round,
  entries,
  isCurrent,
  maxHeight,
}: {
  round: string;
  entries: BracketEntry[];
  isCurrent: boolean;
  maxHeight: number;
}) {
  const headingId = `round-${round.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div
      className="bracket-scroll-y flex w-56 flex-shrink-0 flex-col gap-3 overflow-y-auto"
      style={
        {
          scrollSnapAlign: "start",
          maxHeight,
          ...(isCurrent ? { scrollInitialTarget: "nearest" } : {}),
        } as CSSProperties
      }
    >
      <h3 id={headingId} className="sticky top-0 bg-background text-sm font-semibold text-foreground/70">
        {round}
      </h3>
      {entries.map((entry) => (
        <MatchCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function BracketGrid({ rounds, currentRoundIndex }: { rounds: RoundInfo[]; currentRoundIndex: number }) {
  const currentCount = rounds[currentRoundIndex]?.entries.length ?? 1;
  const maxHeight = HEADING_HEIGHT_ESTIMATE + currentCount * CARD_HEIGHT_ESTIMATE;

  return (
    // Pure CSS, no JS: scroll-snap-type + scroll-snap-align make each round
    // a snap point, and `scroll-initial-target` (Chromium; degrades
    // gracefully to just "starts at the left" elsewhere) declares which
    // snap point the container should be scrolled to on first render.
    <div
      className="bracket-scroll-x overflow-x-auto pb-2"
      style={{ scrollSnapType: "x proximity" } as CSSProperties}
    >
      <div className="flex items-start gap-14">
        {rounds.map((r, i) => (
          <RoundColumn
            key={r.round}
            round={r.round}
            entries={r.entries}
            isCurrent={i === currentRoundIndex}
            maxHeight={maxHeight}
          />
        ))}
      </div>
    </div>
  );
}

export function KnockoutBracket({ fixtures }: { fixtures: Fixture[] }) {
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

  // Always render every round through to the Final, in bracket-defined
  // sizes (16/8/4/2/1) -- rounds/slots the API hasn't populated yet (no
  // both-teams-determined fixture exists server-side) are padded with
  // TBD placeholders, so the overall bracket shape is always visible.
  const roundNames = Object.keys(KNOCKOUT_ROUND_SIZES);
  const reordered = reorderForBracketTopology(
    roundNames.map((round) => ({ round, fixtures: byRound.get(round) ?? [] })),
  );

  const fullRounds: RoundInfo[] = roundNames.map((round, index) => {
    const realFixtures = reordered[index];
    const expectedSize = KNOCKOUT_ROUND_SIZES[round];
    const entries: BracketEntry[] = realFixtures.map((fixture) => ({
      kind: "real" as const,
      id: fixture.id,
      fixture,
    }));
    for (let i = entries.length; i < expectedSize; i++) {
      entries.push({ kind: "placeholder" as const, id: `${round}-${i}`, round });
    }
    return { round, entries };
  });

  const thirdPlace = byRound.get("3rd Place Final")?.[0];

  // The "current" round -- the earliest round that still has an
  // unfinished/placeholder match -- is what the bracket auto-scrolls to
  // on load, since it's the last fully-completed round plus whatever's
  // happening now.
  const activeIndex = fullRounds.findIndex((r) =>
    r.entries.some((e) => e.kind === "placeholder" || !FINISHED.includes(e.fixture.status)),
  );
  const currentRoundIndex = activeIndex === -1 ? fullRounds.length - 1 : activeIndex;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Knockout stage</h2>

      <BracketGrid rounds={fullRounds} currentRoundIndex={currentRoundIndex} />

      {thirdPlace && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground/70">3rd Place Play-off</h3>
          <MatchCard entry={{ kind: "real", id: thirdPlace.id, fixture: thirdPlace }} />
        </div>
      )}
    </section>
  );
}
