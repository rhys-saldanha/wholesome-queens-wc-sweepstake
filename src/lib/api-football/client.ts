const API_BASE = "https://v3.football.api-sports.io";

export const LEAGUE_ID = 1; // FIFA World Cup
export const SEASON = 2026;

export class ApiFootballError extends Error {}
export class ApiFootballNotConfiguredError extends ApiFootballError {}

export async function apiFootballGet(
  pathname: string,
  revalidateSeconds: number,
): Promise<unknown> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new ApiFootballNotConfiguredError("API_FOOTBALL_KEY is not set");
  }

  const res = await fetch(`${API_BASE}${pathname}`, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new ApiFootballError(`API-Football request failed: ${pathname} -> ${res.status}`);
  }

  const json = await res.json();
  if (Array.isArray(json.errors) ? json.errors.length > 0 : Object.keys(json.errors ?? {}).length > 0) {
    throw new ApiFootballError(`API-Football returned errors: ${JSON.stringify(json.errors)}`);
  }

  return json;
}

// Standings only cover group-stage tables, which are complete and static
// once the group stage ends -- no knockout visibility at all. Long default
// since there's nothing left to change; 1 day -> 1 call/day worst case.
export function getStandingsRevalidateSeconds(): number {
  const raw = process.env.STANDINGS_REVALIDATE_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 86400;
}

// Fixtures cover both group-stage AND knockout results/live scores -- this
// is the actual "is a match live right now" signal, so it gets the fast
// interval. Kept below the client's 30s auto-refresh so every refresh
// crosses a cache expiry and picks up fresh data instead of racing it.
// 20s -> ~4,320 calls/day worst case.
export function getFixturesRevalidateSeconds(): number {
  const raw = process.env.FIXTURES_REVALIDATE_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}
