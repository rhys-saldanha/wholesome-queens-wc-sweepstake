"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const AUTO_REFRESH_INTERVAL_MS = 30_000;

function subscribeNoop() {
  return () => {};
}

export function RefreshControl({ lastUpdated }: { lastUpdated: string }) {
  const router = useRouter();

  // Locale-dependent time formatting can differ between server and client,
  // so it's only rendered once hydration is known to be complete: the
  // server snapshot is always false, the client snapshot always true.
  const isHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const clientLabel = isHydrated ? new Date(lastUpdated).toLocaleTimeString() : null;

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
