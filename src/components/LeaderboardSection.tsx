import { Team } from "./Team";
import { PrizeTag } from "./PrizeTag";
import type { Leaderboard } from "@/lib/types";

export function LeaderboardSection({ leaderboard }: { leaderboard: Leaderboard }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <p className="text-sm text-foreground/60">
          {leaderboard.finalStatus === "finished"
            ? "The final has been played — champion and runner-up prizes are settled."
            : "Champion (£30) and runner-up (£20) go to whoever drafted the two finalists — shown once the final is played. Sorted lowest points first: whoever's on top is most at risk of the £10 wooden spoon."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-foreground/10">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Teams</th>
              <th className="px-3 py-2 text-right">Still in</th>
              <th className="px-3 py-2 text-right">Points</th>
              <th className="px-3 py-2">Prizes</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.entries.map((entry) => (
              <tr key={entry.colour} className="border-b border-foreground/5 align-top last:border-0">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.hexColour }}
                    />
                    <span className="font-medium">{entry.displayName}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <details>
                    <summary className="cursor-pointer text-foreground/70 select-none">
                      {entry.teamRecords.length} teams
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1">
                      {entry.teamRecords.map((t) => (
                        <li
                          key={t.apiFootballId}
                          className={`flex items-center justify-between gap-3 ${t.eliminated ? "opacity-40" : ""}`}
                        >
                          <Team teamId={t.apiFootballId} eliminated={t.eliminated} size="sm" />
                          <span className="text-xs text-foreground/60 tabular-nums">
                            {t.eliminated && "OUT · "}
                            {t.record.wins}W {t.record.draws}D {t.record.losses}L · {t.record.points}pt
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                  {entry.teamsRemaining}/{entry.teamRecords.length}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{entry.totalPoints}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.prizes.length === 0 ? (
                      <span className="text-xs text-foreground/40">—</span>
                    ) : (
                      entry.prizes.map((prize, i) => <PrizeTag key={i} prize={prize} />)
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
