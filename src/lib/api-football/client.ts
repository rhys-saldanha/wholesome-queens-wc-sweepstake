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

export function getRevalidateSeconds(): number {
  const raw = process.env.FIXTURES_REVALIDATE_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}
