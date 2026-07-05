"use client";

import { useEffect, useState } from "react";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Kicking off…";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return days > 0
    ? `${days}d ${hours}h ${pad(minutes)}m ${pad(seconds)}s`
    : `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime();
  // Avoids a hydration mismatch: the server and client would otherwise
  // compute "now" at slightly different instants, producing different text.
  const [state, setState] = useState<{ label: string; urgent: boolean } | null>(null);

  useEffect(() => {
    const tick = () => {
      const remaining = target - Date.now();
      setState({ label: formatRemaining(remaining), urgent: remaining > 0 && remaining < ONE_DAY_MS });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <span className={state?.urgent ? "text-red-500 font-semibold" : undefined} suppressHydrationWarning>
      {state?.label ?? " "}
    </span>
  );
}
