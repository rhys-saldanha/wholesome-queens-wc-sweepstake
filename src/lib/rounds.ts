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
