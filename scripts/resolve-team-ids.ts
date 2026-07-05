/**
 * One-time offline script: resolves each drafted team to its API-Football
 * team ID, code (abbreviation), and canonical name, then writes
 * src/data/sweepstake.json.
 *
 * Not run at request time. Re-run manually if API-Football's team IDs
 * ever change, or to regenerate the JSON from scratch.
 *
 * Usage: API_FOOTBALL_KEY=xxxx npx tsx scripts/resolve-team-ids.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const API_BASE = "https://v3.football.api-sports.io";
const LEAGUE = 1; // World Cup
const SEASON = 2026;

const apiKey = process.env.API_FOOTBALL_KEY;
if (!apiKey) {
  console.error("Set API_FOOTBALL_KEY in the environment before running this script.");
  process.exit(1);
}

type ApiTeam = { id: number; name: string; code: string | null };

async function apiGet<T>(pathname: string): Promise<T> {
  const res = await fetch(`${API_BASE}${pathname}`, {
    headers: { "x-apisports-key": apiKey! },
  });
  if (!res.ok) {
    throw new Error(`API-Football request failed: ${pathname} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Colour -> the 8 team names as originally given for the draft. Some of
// these differ from API-Football's own naming (see ALIAS_TO_API_NAME
// below) -- e.g. "Côte d'Ivoire" is "Ivory Coast" in API-Football's data.
const DRAFT: Record<string, string[]> = {
  green: ["Brazil", "Croatia", "USA", "Ecuador", "Côte d'Ivoire", "Paraguay", "Saudi Arabia", "Curaçao"],
  yellow: ["Portugal", "Germany", "Mexico", "South Korea", "Norway", "Tunisia", "Iraq", "Haiti"],
  blue: ["France", "Netherlands", "Senegal", "Australia", "Canada", "Scotland", "Jordan", "New Zealand"],
  red: ["Spain", "Colombia", "Switzerland", "Iran", "Panama", "Czechia", "South Africa", "Cape Verde"],
  purple: ["Argentina", "Belgium", "Uruguay", "Austria", "Egypt", "Sweden", "Qatar", "Bosnia & Herzegovina"],
  orange: ["England", "Morocco", "Japan", "Türkiye", "Algeria", "DR Congo", "Uzbekistan", "Ghana"],
};

const ALIAS_TO_API_NAME: Record<string, string> = {
  "Côte d'Ivoire": "Ivory Coast",
  "Cape Verde": "Cape Verde Islands",
  "DR Congo": "Congo DR",
};

const DISPLAY_META: Record<string, { displayName: string; hexColour: string }> = {
  green: { displayName: "Green Gazelle", hexColour: "#22c55e" },
  yellow: { displayName: "Yellow Yak", hexColour: "#eab308" },
  blue: { displayName: "Blue Badger", hexColour: "#3b82f6" },
  red: { displayName: "Red Raccoon", hexColour: "#ef4444" },
  purple: { displayName: "Purple Panda", hexColour: "#a855f7" },
  orange: { displayName: "Orange Otter", hexColour: "#f97316" },
};

async function main() {
  const teamsRes = await apiGet<{ response: { team: ApiTeam }[] }>(
    `/teams?league=${LEAGUE}&season=${SEASON}`,
  );
  const teamsByName = new Map(teamsRes.response.map(({ team }) => [team.name, team]));

  const players = [];
  const missing: string[] = [];

  for (const [colour, names] of Object.entries(DRAFT)) {
    const teams = [];
    for (const draftName of names) {
      const apiName = ALIAS_TO_API_NAME[draftName] ?? draftName;
      const team = teamsByName.get(apiName);
      if (!team) {
        missing.push(`${colour}: ${draftName} (looked up as "${apiName}")`);
        continue;
      }
      teams.push({
        apiFootballId: team.id,
        abbreviation: team.code,
        name: team.name,
      });
    }
    players.push({
      colour,
      displayName: DISPLAY_META[colour].displayName,
      hexColour: DISPLAY_META[colour].hexColour,
      teams,
    });
  }

  if (missing.length > 0) {
    console.error("Could not resolve the following teams:");
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }

  const outPath = path.join(__dirname, "..", "src", "data", "sweepstake.json");
  writeFileSync(outPath, JSON.stringify({ players }, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
