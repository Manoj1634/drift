/**
 * Tiny TTL cache for live market / Grok calls.
 * In-process (warm instances + inflight coalescing). On Next/Vercel, also
 * the Data Cache via unstable_cache. Failures are not stored.
 */
import { unstable_cache } from "next/cache";

const mem = new Map<string, { exp: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const loaders = new Map<string, () => Promise<unknown>>();

/** Odds move — keep market snapshots short. */
export const MARKET_TTL_MS = 90_000;
/** Slow xAI evidence / correlator / investigator. */
export const SLOW_TTL_MS = 8 * 60_000;

const persistFast = unstable_cache(
  async (key: string) => runLoader(key),
  ["drift-ttl-fast"],
  { revalidate: 90 },
);

const persistSlow = unstable_cache(
  async (key: string) => runLoader(key),
  ["drift-ttl-slow"],
  { revalidate: 480 },
);

function runLoader(key: string) {
  const load = loaders.get(key);
  if (!load) throw new Error(`ttl cache loader missing for ${key}`);
  return load();
}

function useNextCache() {
  return Boolean(process.env.NEXT_RUNTIME || process.env.VERCEL);
}

/** Align live "now" windows so repeat hits share a key. Replay ISOs stay put. */
export function bucketIso(iso: string, bucketMs = 10 * 60_000): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(Math.floor(t / bucketMs) * bucketMs).toISOString();
}

export async function cached<T>(opts: {
  key: string;
  ttlMs: number;
  /** Must throw on failure — thrown errors are not cached. */
  load: () => Promise<T>;
  fallback: () => T | Promise<T>;
}): Promise<T> {
  const { key, ttlMs, load, fallback } = opts;
  const hit = mem.get(key);
  if (hit && hit.exp > Date.now()) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const run = (async () => {
    try {
      loaders.set(key, load);
      const value = useNextCache()
        ? ((await (ttlMs > 120_000 ? persistSlow(key) : persistFast(key))) as T)
        : await load();
      mem.set(key, { exp: Date.now() + ttlMs, value });
      return value;
    } catch {
      return fallback();
    }
  })().finally(() => inflight.delete(key));

  inflight.set(key, run);
  return run;
}
