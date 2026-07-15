import type { CSSProperties } from "react";
import { Team } from "./Team";
import { Countdown } from "./Countdown";
import { resolveTeam } from "@/lib/data/team-lookup";
import { KNOCKOUT_ROUND_ORDER } from "@/lib/rounds";
import type { Fixture } from "@/lib/types";

const FINISHED: Fixture["status"][] = ["FT", "AET", "PEN"];

// One fixed CSS class per round (r32/r16/qf/sf/final), each with its own
// literal, hardcoded `anchor-name` in globals.css -- no dynamic anchor
// names, no var() indirection for position-anchor.
const ROUND_SLUG: Record<string, string> = {
  "Round of 32": "r32",
  "Round of 16": "r16",
  "Quarter-finals": "qf",
  "Semi-finals": "sf",
  Final: "final",
};

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
    default: {
      const clock = liveClock(fixture);
      return { text: clock ? `LIVE ${clock}` : "LIVE", live: true };
    }
  }
}

/** In-play clock shown next to the LIVE tag: "HT" at half time, else "63'" / "45+3'". */
function liveClock(fixture: Fixture): string | null {
  if (fixture.status === "HT") return "HT";
  if (fixture.elapsed == null) return null;
  return fixture.elapsedExtra
    ? `${fixture.elapsed}+${fixture.elapsedExtra}'`
    : `${fixture.elapsed}'`;
}

function MatchCard({ fixture }: { fixture: Fixture }) {
  const home = resolveTeam(fixture.homeTeamId);
  const away = resolveTeam(fixture.awayTeamId);
  const { text, live } = statusLabel(fixture);
  const played = fixture.goalsHome != null && fixture.goalsAway != null;
  // Synthesized slots (the API hasn't created this fixture yet) have no
  // real kickoff time -- nothing to count down to, so the trailer is blank.
  const isSynthesized = fixture.date == null;

  return (
    <div
      className={`bracket-match-card flex w-full flex-col gap-1 rounded-md border-2 bg-background px-3 py-2 text-sm ${
        isSynthesized ? "border-dashed border-foreground/10" : "border-foreground/10"
      }`}
      role="group"
      aria-label={`${home.name} vs ${away.name}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Team teamId={fixture.homeTeamId} size="sm" />
        {played && <span className="tabular-nums font-semibold">{fixture.goalsHome}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Team teamId={fixture.awayTeamId} size="sm" />
        {played && <span className="tabular-nums font-semibold">{fixture.goalsAway}</span>}
      </div>
      {!isSynthesized && (
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
          {fixture.status === "NS" ? <Countdown targetDate={fixture.date as string} /> : text}
        </span>
      )}
    </div>
  );
}

interface MatchSlot {
  fixture: Fixture;
  // Shown above the card when a column holds more than one kind of match
  // (the Finals column: "Final" vs "3rd Place Play-off").
  label?: string;
}

interface RoundInfo {
  round: string;
  title: string;
  matches: MatchSlot[];
}

// Rough height of one match card (including its gap to the next) -- used
// only to cap column height at roughly the current round's own size, so
// columns with more matches (typically earlier, bigger rounds) require a
// deliberate vertical scroll rather than dictating everyone else's height.
const CARD_HEIGHT_ESTIMATE = 96;
const HEADING_HEIGHT_ESTIMATE = 32;
const MATCH_LABEL_HEIGHT_ESTIMATE = 20;

/**
 * Each round is its own independently-sized column, capped at roughly the
 * current round's height -- that's what forces a vertical scroll to see
 * the rest of a taller (earlier) round, rather than every column matching
 * whichever round happens to have the most matches.
 */
function RoundColumn({
  round,
  title,
  matches,
  isCurrent,
  maxHeight,
}: {
  round: string;
  title: string;
  matches: MatchSlot[];
  isCurrent: boolean;
  maxHeight: number;
}) {
  const headingId = `round-${round.replace(/\s+/g, "-").toLowerCase()}`;
  const slug = ROUND_SLUG[round];
  return (
    <div
      className={`bracket-scroll-y bracket-scroll-y-${slug} flex w-56 flex-shrink-0 flex-col gap-3 overflow-y-auto`}
      style={
        {
          scrollSnapAlign: "start",
          maxHeight,
          ...(isCurrent ? { scrollInitialTarget: "nearest" } : {}),
        } as CSSProperties
      }
    >
      <h3 id={headingId} className="sticky top-0 bg-background text-sm font-semibold text-foreground/70">
        {title}
      </h3>
      {matches.map(({ fixture, label }) => (
        <div key={fixture.id} className="flex flex-col gap-1">
          {label && (
            <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              {label}
            </span>
          )}
          <MatchCard fixture={fixture} />
        </div>
      ))}
    </div>
  );
}

function BracketGrid({ rounds, currentRoundIndex }: { rounds: RoundInfo[]; currentRoundIndex: number }) {
  const currentMatches = rounds[currentRoundIndex]?.matches ?? [];
  const currentCount = currentMatches.length || 1;
  const labelCount = currentMatches.filter((m) => m.label).length;
  const maxHeight =
    HEADING_HEIGHT_ESTIMATE +
    currentCount * CARD_HEIGHT_ESTIMATE +
    labelCount * MATCH_LABEL_HEIGHT_ESTIMATE;

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
            title={r.title}
            matches={r.matches}
            isCurrent={i === currentRoundIndex}
            maxHeight={maxHeight}
          />
        ))}
      </div>
    </div>
  );
}

export function KnockoutBracket({ fixtures }: { fixtures: Fixture[] }) {
  // Every knockout round (real fixtures plus API-Football hasn't-created-it-
  // yet slots) arrives already padded to its bracket-defined size (16/8/4/2/
  // 1) and in bracket topology order -- see padKnockoutFixtures in
  // lib/api-football/knockout-bracket.ts, run once at fetch time.
  const byRound = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    if (!(KNOCKOUT_ROUND_ORDER as readonly string[]).includes(fixture.round)) continue;
    const list = byRound.get(fixture.round) ?? [];
    list.push(fixture);
    byRound.set(fixture.round, list);
  }

  // The 3rd Place Final shares the last column with the Final rather than
  // getting its own round: both are played in the same "week" of the bracket,
  // so the column is titled "Finals" and each match carries its own label.
  const roundNames = (KNOCKOUT_ROUND_ORDER as readonly string[]).filter((r) => r !== "3rd Place Final");
  const thirdPlace = byRound.get("3rd Place Final")?.[0];
  const fullRounds: RoundInfo[] = roundNames.map((round) => {
    const fixtures = byRound.get(round) ?? [];
    if (round !== "Final") {
      return { round, title: round, matches: fixtures.map((fixture) => ({ fixture })) };
    }
    const matches: MatchSlot[] = fixtures.map((fixture) => ({ fixture, label: "Final" }));
    if (thirdPlace) matches.push({ fixture: thirdPlace, label: "3rd Place Play-off" });
    return { round, title: "Finals", matches };
  });

  // The "current" round -- the earliest round that still has an
  // unfinished/not-yet-created match -- is what the bracket auto-scrolls to
  // on load, since it's the last fully-completed round plus whatever's
  // happening now.
  const activeIndex = fullRounds.findIndex((r) =>
    r.matches.some(({ fixture: f }) => f.date == null || !FINISHED.includes(f.status)),
  );
  const currentRoundIndex = activeIndex === -1 ? fullRounds.length - 1 : activeIndex;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Knockout stage</h2>

      <BracketGrid rounds={fullRounds} currentRoundIndex={currentRoundIndex} />
    </section>
  );
}
