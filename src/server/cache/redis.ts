import "server-only"
import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"

// Gracefully degrade when Redis env vars aren't set (local dev without Redis)
export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

/** Cache get — returns null if Redis unavailable or key missing */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

/** Cache set with optional TTL in seconds (default 60s) */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // non-fatal — cache miss is acceptable
  }
}

/** Invalidate a single key */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {}
}

