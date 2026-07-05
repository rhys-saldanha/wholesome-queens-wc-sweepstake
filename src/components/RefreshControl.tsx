"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function RefreshControl({ lastUpdated }: { lastUpdated: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Locale-dependent time formatting can differ between server and client,
  // so it's computed only after mount to avoid a hydration mismatch.
  const [clientLabel, setClientLabel] = useState<string | null>(null);

  useEffect(() => {
    setClientLabel(new Date(lastUpdated).toLocaleTimeString());
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-3 text-xs text-foreground/60">
      <span suppressHydrationWarning>{clientLabel ? `Last updated ${clientLabel}` : " "}</span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        className="rounded-md border border-foreground/20 px-2.5 py-1 font-medium hover:bg-foreground/5 disabled:opacity-50"
      >
        {isPending ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
