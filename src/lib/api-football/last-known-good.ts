export interface LastKnownGoodResult<T> {
  data: T;
  /** True when `data` came from the fallback slot because the fetch failed. */
  stale: boolean;
}

/**
 * In-memory last-known-good fallback, one slot per wrapped fetcher. Sits
 * behind Next's fetch data cache (which only stores *successful* responses):
 * when a fetch or parse fails, the previous good result is served with
 * `stale: true` instead of surfacing an empty page. Held for the lifetime of
 * the server process -- per instance on serverless, which is the best a
 * store-free BFF can do. Still throws when there's no good result yet.
 */
export function withLastKnownGood<T>(
  fetcher: () => Promise<T>,
): () => Promise<LastKnownGoodResult<T>> {
  let lastGood: { value: T } | null = null;

  return async () => {
    try {
      const value = await fetcher();
      lastGood = { value };
      return { data: value, stale: false };
    } catch (error) {
      if (lastGood) {
        console.error("Serving last-known-good data after fetch failure:", error);
        return { data: lastGood.value, stale: true };
      }
      throw error;
    }
  };
}
