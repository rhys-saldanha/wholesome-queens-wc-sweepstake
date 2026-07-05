"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTO_REFRESH_INTERVAL_MS = 30_000;

export function RefreshControl({ lastUpdated }: { lastUpdated: string }) {
  const router = useRouter();

  // Locale-dependent time formatting can differ between server and client,
  // so it's computed only after mount to avoid a hydration mismatch.
  const [clientLabel, setClientLabel] = useState<string | null>(null);

  useEffect(() => {
    setClientLabel(new Date(lastUpdated).toLocaleTimeString());
  }, [lastUpdated]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <span className="text-xs text-foreground/60" suppressHydrationWarning>
      {clientLabel ? `Last updated ${clientLabel}` : " "}
    </span>
  );
}
