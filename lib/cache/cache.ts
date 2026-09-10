/**
 * Platform Scale & Caching Layer (Phase 17)
 *
 * Provides thread-safe, TTL-based caching for hot query feeds (e.g. /r/cec feeds, trending calculations)
 * to minimize PostgreSQL read load during campus traffic spikes.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const memoryStore = new Map<string, CacheEntry<any>>()

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const now = Date.now()
  const existing = memoryStore.get(key)

  if (existing && existing.expiresAt > now) {
    return existing.data
  }

  const freshData = await fetcher()
  memoryStore.set(key, {
    data: freshData,
    expiresAt: now + ttlSeconds * 1000,
  })

  return freshData
}

export function invalidateCache(keyPrefix: string) {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryStore.delete(key)
    }
  }
}
