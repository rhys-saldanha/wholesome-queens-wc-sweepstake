// Standard knockout round progression for the 48-team World Cup format,
// in chronological/bracket order. Group stage rounds are handled separately
// (see GroupsGrid) and intentionally excluded here.
export const KNOCKOUT_ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "3rd Place Final",
  "Final",
] as const;

// Expected number of matches per round in the champion-progression bracket
// (excludes "3rd Place Final", which isn't part of that tree -- it's padded
// separately in knockout-bracket.ts). Used to render the full bracket shape --
// including
// rounds/matches the API hasn't populated yet -- as TBD placeholders.
export const KNOCKOUT_ROUND_SIZES: Record<string, number> = {
  "Round of 32": 16,
  "Round of 16": 8,
  "Quarter-finals": 4,
  "Semi-finals": 2,
  Final: 1,
};
