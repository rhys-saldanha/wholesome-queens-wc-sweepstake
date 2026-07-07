export type ColourKey = "green" | "yellow" | "blue" | "red" | "purple" | "orange";

export interface Team {
  apiFootballId: number;
  abbreviation: string;
  name: string;
}

export interface Player {
  colour: ColourKey;
  displayName: string;
  hexColour: string;
  teams: Team[];
}

export type FixtureStatus =
  | "NS" // not started
  | "1H"
  | "HT"
  | "2H"
  | "ET"
  | "BT" // break time (before penalties)
  | "P" // penalty shootout in progress
  | "SUSP"
  | "INT"
  | "FT"
  | "AET"
  | "PEN" // finished after penalties
  | "PST"
  | "CANC"
  | "ABD"
  | "AWD"
  | "WO"
  | "LIVE";

export interface Fixture {
  id: number;
  /** Null for a knockout slot the API hasn't created a fixture for yet -- its kickoff isn't known. */
  date: string | null;
  round: string;
  status: FixtureStatus;
  /** Null when that side of a knockout slot hasn't been decided yet. */
  homeTeamId: number | null;
  awayTeamId: number | null;
  goalsHome: number | null;
  goalsAway: number | null;
  /** Current match minute while in play; null before kickoff and after full time. */
  elapsed: number | null;
  /** Added (injury) time minutes on top of `elapsed`, when the API reports it. */
  elapsedExtra: number | null;
  /** Winner as reported by the API once the shootout (if any) is decided. */
  penaltyWinnerTeamId: number | null;
}

export interface GroupStandingRow {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsDiff: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  rows: GroupStandingRow[];
}

export type TeamRecord = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

export type PrizeLabel =
  | { kind: "champion"; amount: 30 }
  | { kind: "runnerUp"; amount: 20 }
  | { kind: "woodenSpoon"; amount: 10; shared: boolean };

export interface LeaderboardEntry {
  colour: ColourKey;
  displayName: string;
  hexColour: string;
  teamRecords: (Team & { record: TeamRecord; eliminated: boolean })[];
  totalPoints: number;
  teamsRemaining: number;
  prizes: PrizeLabel[];
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  finalStatus: "not_played" | "finished";
}
