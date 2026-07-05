"use client";

import { useEffect, useState } from "react";

export function RefreshControl({ lastUpdated }: { lastUpdated: string }) {
  // Locale-dependent time formatting can differ between server and client,
  // so it's computed only after mount to avoid a hydration mismatch.
  const [clientLabel, setClientLabel] = useState<string | null>(null);

  useEffect(() => {
    setClientLabel(new Date(lastUpdated).toLocaleTimeString());
  }, [lastUpdated]);

  return (
    <span className="text-xs text-foreground/60" suppressHydrationWarning>
      {clientLabel ? `Last updated ${clientLabel}` : " "}
    </span>
  );
}
