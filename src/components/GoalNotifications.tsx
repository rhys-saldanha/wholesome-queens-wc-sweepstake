"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { resolveTeam } from "@/lib/data/team-lookup";
import type { Fixture } from "@/lib/types";

type Score = { home: number; away: number };
type PermissionState = NotificationPermission | "unsupported";

// Notification.permission has no change event, so it's tracked in a tiny
// external store: useSyncExternalStore reads it consistently across the
// server-rendered "unsupported" placeholder and the real client value.
const permissionListeners = new Set<() => void>();
let cachedPermission: PermissionState =
  typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";

function subscribePermission(onChange: () => void) {
  permissionListeners.add(onChange);
  return () => permissionListeners.delete(onChange);
}

function getPermissionSnapshot() {
  return cachedPermission;
}

function getServerPermissionSnapshot(): PermissionState {
  return "unsupported";
}

function setCachedPermission(value: PermissionState) {
  cachedPermission = value;
  permissionListeners.forEach((listener) => listener());
}

export function GoalNotifications({ fixtures }: { fixtures: Fixture[] }) {
  const permission = useSyncExternalStore(
    subscribePermission,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );
  // null until the first fixtures snapshot is captured, so we never notify
  // for goals that were already scored before the page loaded.
  const previousGoals = useRef<Map<number, Score> | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    const previous = previousGoals.current;
    const next = new Map<number, Score>();

    for (const fixture of fixtures) {
      const score: Score = { home: fixture.goalsHome ?? 0, away: fixture.goalsAway ?? 0 };
      next.set(fixture.id, score);

      const before = previous?.get(fixture.id);
      if (before && permission === "granted" && (score.home > before.home || score.away > before.away)) {
        notifyGoal(fixture, before, score);
      }
    }

    previousGoals.current = next;
  }, [fixtures, permission]);

  if (permission !== "default") return null;

  return (
    <button
      type="button"
      onClick={async () => {
        const result = await Notification.requestPermission();
        setCachedPermission(result);
      }}
      className="rounded-full border border-foreground/20 px-3 py-1 text-xs font-medium text-foreground/70 hover:bg-foreground/5"
    >
      🔔 Enable goal alerts
    </button>
  );
}

function notifyGoal(fixture: Fixture, before: Score, after: Score) {
  const home = resolveTeam(fixture.homeTeamId);
  const away = resolveTeam(fixture.awayTeamId);
  const scorer = after.home > before.home ? home : away;
  const title = `⚽ Goal! ${scorer.name}`;
  const body = `${home.abbreviation} ${after.home}-${after.away} ${away.abbreviation}`;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "/favicon.ico",
        tag: `fixture-${fixture.id}`,
      });
    });
  } else {
    new Notification(title, { body });
  }
}
