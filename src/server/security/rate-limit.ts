import "server-only"
import { redis } from "@/server/cache/redis"

export type RateLimitResult = {
    success: boolean
    /** Requests left in the current window (0 when blocked) */
    remaining: number
    /** Seconds until the window resets — usable as a Retry-After header */
    resetInSeconds: number
}

/**
 * Fixed-window rate limiter on Upstash Redis.
 *
 * SECURITY: fails OPEN when Redis is not configured (local dev) so the app
 * keeps working, but that means production MUST have Upstash configured for
 * limits to be enforced. Keep expensive endpoints (AI, auth) behind this.
 *
 * @param key    identifies the caller+endpoint, e.g. `ai-chat:${userId}`
 * @param limit  max requests per window
 * @param windowSeconds window length in seconds
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    if (!redis) {
        return { success: true, remaining: limit, resetInSeconds: 0 }
    }

    const window = Math.floor(Date.now() / 1000 / windowSeconds)
    const redisKey = `ratelimit:${key}:${window}`

    try {
        const count = await redis.incr(redisKey)
        // First hit in this window sets the TTL so the key self-destructs
        if (count === 1) {
            await redis.expire(redisKey, windowSeconds)
        }
        const resetInSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds)
        return {
            success: count <= limit,
            remaining: Math.max(0, limit - count),
            resetInSeconds,
        }
    } catch {
        // Redis outage should degrade availability of the limiter, not the app
        return { success: true, remaining: limit, resetInSeconds: 0 }
    }
}
