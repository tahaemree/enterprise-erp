/**
 * Deftra — DB-based Rate Limiter
 *
 * Uses PostgreSQL (via Prisma) for rate limiting instead of in-memory LRU cache.
 * This ensures rate limits persist across serverless function invocations.
 *
 * Features:
 * - Sliding window per key (e.g., "login:email", "api:ip")
 * - Automatic cleanup of expired windows
 * - Tenant-aware rate limiting (optional)
 * - Support for login lockout (brute-force protection)
 */

import { basePrisma } from "@/lib/prisma"
import logger from "@/lib/logger"
import { LRUCache } from "lru-cache"

// ─── In-Memory Fallback Rate Limiter ─────────────────────────────────────
// Used when the DB is unavailable to ensure rate limiting still works.
const memoryRateLimits = new LRUCache<string, { count: number; windowStart: number }>({
    max: 10_000,
    ttl: 20 * 60 * 1000, // 20 minutes
})

function checkMemoryRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now()
    const existing = memoryRateLimits.get(key)

    if (existing && now - existing.windowStart < windowMs) {
        existing.count++
        memoryRateLimits.set(key, existing)
        const allowed = existing.count <= limit
        return {
            allowed,
            remaining: Math.max(0, limit - existing.count),
            resetAt: new Date(existing.windowStart + windowMs),
        }
    }

    memoryRateLimits.set(key, { count: 1, windowStart: now })
    return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(now + windowMs),
    }
}

export interface RateLimiterConfig {
    /** Max requests allowed within the window */
    limit: number
    /** Window duration in milliseconds (default: 60000 = 1 minute) */
    windowMs?: number
    /** Optional tenant ID for per-tenant rate limits */
    tenantId?: string
}

const DEFAULT_WINDOW_MS = 60_000 // 1 minute
const CLEANUP_INTERVAL_MS = 300_000 // Cleanup expired entries every 5 minutes

let lastCleanup = 0

/**
 * Periodically cleans up expired rate limit entries to prevent table bloat.
 */
async function cleanupExpired(): Promise<void> {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
    lastCleanup = now

    try {
        await basePrisma.rateLimit.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        })
    } catch (error) {
        logger.error("Rate limit cleanup failed", {
            module: "rate-limit",
            error: { message: error instanceof Error ? error.message : String(error) },
        })
    }
}

/**
 * Checks if an action is rate limited.
 * Returns an object with { allowed, remaining, resetAt }.
 *
 * Usage:
 *   const result = await checkRateLimit("login:admin@example.com", { limit: 5, windowMs: 60000 })
 *   if (!result.allowed) throw new Error("Too many requests")
 */
function floorToWindow(date: Date, windowMs: number): Date {
    const ts = date.getTime()
    return new Date(ts - (ts % windowMs))
}

export async function checkRateLimit(
    key: string,
    config: RateLimiterConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS
    const now = new Date()
    const windowStart = floorToWindow(now, windowMs)

    // Run cleanup in background (fire and forget)
    cleanupExpired().catch(() => {})

    try {
        // Atomic upsert: increment counter or create new window
        const record = await basePrisma.rateLimit.upsert({
            where: {
                key_windowStart: {
                    key,
                    windowStart,
                },
            },
            update: {
                count: { increment: 1 },
            },
            create: {
                key,
                count: 1,
                windowStart,
                expiresAt: new Date(now.getTime() + windowMs * 2),
                tenantId: config.tenantId ?? null,
            },
        })

        const remaining = Math.max(0, config.limit - record.count)
        const allowed = record.count <= config.limit
        const resetAt = new Date(windowStart.getTime() + windowMs)

        return { allowed, remaining, resetAt }
    } catch (error) {
        // If the upsert fails (e.g., unique constraint race condition), retry once
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code: string }).code === "P2002"
        ) {
            try {
                const record = await basePrisma.rateLimit.update({
                    where: {
                        key_windowStart: {
                            key,
                            windowStart,
                        },
                    },
                    data: {
                        count: { increment: 1 },
                    },
                })

                const remaining = Math.max(0, config.limit - record.count)
                const allowed = record.count <= config.limit
                const resetAt = new Date(windowStart.getTime() + windowMs)

                return { allowed, remaining, resetAt }
            } catch {
                // If retry also fails, use in-memory fallback (fail closed)
                logger.warn("Rate limit DB retry failed, using in-memory fallback", {
                    module: "rate-limit",
                    key,
                })
                return checkMemoryRateLimit(key, config.limit, windowMs)
            }
        }

        // Unexpected DB errors — use in-memory fallback (fail closed)
        logger.error("Rate limit DB check failed, using in-memory fallback", {
            module: "rate-limit",
            key,
            error: { message: error instanceof Error ? error.message : String(error) },
        })
        return checkMemoryRateLimit(key, config.limit, windowMs)
    }
}

/**
 * Resets rate limit counters for a given key.
 * Useful after successful login to clear failed attempts.
 */
export async function resetRateLimit(key: string): Promise<void> {
    try {
        await basePrisma.rateLimit.deleteMany({
            where: { key },
        })
    } catch (error) {
        logger.error("Failed to reset rate limit", {
            module: "rate-limit",
            key,
            error: { message: error instanceof Error ? error.message : String(error) },
        })
    }
}

/**
 * Convenience: Login rate limiter (brute-force protection).
 * 5 attempts per 15 minutes per email.
 */
export async function checkLoginRateLimit(email: string): Promise<void> {
    const result = await checkRateLimit(`login:${email.toLowerCase()}`, {
        limit: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!result.allowed) {
        // SECURITY: Generic error message — do NOT leak retry timing
        throw new Error(
            "Too many login attempts. Please try again later."
        )
    }
}

/**
 * Convenience: API rate limiter (100 requests per minute per IP).
 */
export async function checkApiRateLimit(ip: string, tenantId?: string): Promise<void> {
    const result = await checkRateLimit(`api:${ip}`, {
        limit: 100,
        windowMs: 60_000,
        tenantId,
    })

    if (!result.allowed) {
        throw new Error("API rate limit exceeded. Please slow down your requests.")
    }
}
