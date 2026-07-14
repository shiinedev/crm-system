import "server-only"
import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

// Gracefully degrade when Redis isn't configured (local dev):
// requests are allowed through, same policy as the cache helpers.
const aiChatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "rl:ai-chat",
    })
  : null

export type RateLimitResult = {
  success: boolean
  /** Seconds until the window resets, only set when blocked */
  retryAfter?: number
}

/** Limit AI chat requests to 20/min per user. */
export async function limitAiChat(userId: string): Promise<RateLimitResult> {
  if (!aiChatLimiter) return { success: true }
  try {
    const { success, reset } = await aiChatLimiter.limit(userId)
    return {
      success,
      retryAfter: success ? undefined : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    }
  } catch {
    // Redis outage should not take the feature down
    return { success: true }
  }
}
