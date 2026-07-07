import { z } from "zod";

// Raw API-Football response shapes -- only the fields we actually use.
// Display data (names/abbreviations) is intentionally NOT trusted from
// here; it always comes from our own embedded sweepstake.json, keyed by
// team id, so these schemas only need ids + the dynamic bits (scores,
// status, standings numbers).

export const FixtureStatusSchema = z.enum([
  "NS",
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "SUSP",
  "INT",
  "FT",
  "AET",
  "PEN",
  "PST",
  "CANC",
  "ABD",
  "AWD",
  "WO",
  "LIVE",
]);

export const FixtureItemSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({
      short: FixtureStatusSchema,
      elapsed: z.number().nullable(),
      // Added (injury) time on top of `elapsed`; newer API field, so
      // tolerate it being absent entirely.
      extra: z.number().nullable().optional(),
    }),
  }),
  league: z.object({
    round: z.string(),
  }),
  teams: z.object({
    home: z.object({ id: z.number(), winner: z.boolean().nullable() }),
    away: z.object({ id: z.number(), winner: z.boolean().nullable() }),
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
});

export const FixturesResponseSchema = z.object({
  response: z.array(FixtureItemSchema),
});

export const StandingsRowSchema = z.object({
  group: z.string(),
  team: z.object({ id: z.number() }),
  points: z.number(),
  all: z.object({
    played: z.number(),
    win: z.number(),
    draw: z.number(),
    lose: z.number(),
  }),
  goalsDiff: z.number(),
});

export const StandingsResponseSchema = z.object({
  response: z
    .array(
      z.object({
        league: z.object({
          standings: z.array(z.array(StandingsRowSchema)),
        }),
      }),
    )
    .max(1),
});
