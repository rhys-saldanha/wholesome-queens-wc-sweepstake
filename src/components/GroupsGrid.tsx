import { Team } from "./Team";
import type { GroupStanding } from "@/lib/types";

export function GroupsGrid({ groups }: { groups: GroupStanding[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-foreground/60">Group standings are not available right now.</p>;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Groups</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.group} className="rounded-lg border border-foreground/10 p-3">
            <h3 className="mb-2 text-sm font-semibold text-foreground/70">{group.group}</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-foreground/40">
                  <th className="pb-1 font-normal">Team</th>
                  <th className="pb-1 pl-2 text-right font-normal">P</th>
                  <th className="pb-1 pl-2 text-right font-normal">W</th>
                  <th className="pb-1 pl-2 text-right font-normal">D</th>
                  <th className="pb-1 pl-2 text-right font-normal">L</th>
                  <th className="pb-1 pl-2 text-right font-normal">GD</th>
                  <th className="pb-1 pl-2 text-right font-normal">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => {
                  return (
                    <tr key={row.teamId}>
                      <td className="py-0.5">
                        <Team teamId={row.teamId} size="sm" />
                      </td>
                      <td className="py-0.5 pl-2 text-right tabular-nums">{row.played}</td>
                      <td className="py-0.5 pl-2 text-right tabular-nums">{row.won}</td>
                      <td className="py-0.5 pl-2 text-right tabular-nums">{row.drawn}</td>
                      <td className="py-0.5 pl-2 text-right tabular-nums">{row.lost}</td>
                      <td className="py-0.5 pl-2 text-right tabular-nums">{row.goalsDiff}</td>
                      <td className="py-0.5 pl-2 text-right font-semibold tabular-nums">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
