"use client";

import { useRef } from "react";
import { Team } from "./Team";
import type { LeaderboardEntry } from "@/lib/types";

export function TeamsCell({ entry }: { entry: LeaderboardEntry }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="cursor-pointer text-foreground/70 underline decoration-dotted underline-offset-2"
        onClick={() => dialogRef.current?.showModal()}
      >
        {entry.teamRecords.length} teams
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-72 rounded-lg border border-foreground/10 bg-background p-4 text-foreground backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-medium">{entry.displayName}&rsquo;s teams</h3>
          <button
            type="button"
            className="cursor-pointer text-foreground/50 hover:text-foreground"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="flex flex-col gap-1">
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
      </dialog>
    </>
  );
}
