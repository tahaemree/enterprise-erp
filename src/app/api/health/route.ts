import { NextResponse } from "next/server"
import { basePrisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

/**
 * Deep health check for load balancers, Kubernetes probes, and monitoring.
 *
 * GET /api/health
 *
 * Each dependency is probed independently with a short timeout so one slow
 * backend can't hang the probe. The database is treated as critical (its
 * failure returns 503); Redis is best-effort (rate limiting degrades but the
 * app still serves), so a Redis-only failure returns 200 with status
 * "degraded".
 *
 * Returns:
 *   200 — { status: "ok" | "degraded", checks: {...} }
 *   503 — { status: "error", checks: {...} }   (database unreachable)
 */

export const dynamic = "force-dynamic"

const PROBE_TIMEOUT_MS = 2000

interface CheckResult {
    status: "up" | "down"
    latencyMs: number
    error?: string
}

/** Run a probe with a hard timeout so a hung dependency can't stall the route. */
async function probe(fn: () => Promise<unknown>): Promise<CheckResult> {
    const start = Date.now()
    try {
        await Promise.race([
            fn(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`timed out after ${PROBE_TIMEOUT_MS}ms`)), PROBE_TIMEOUT_MS)
            ),
        ])
        return { status: "up", latencyMs: Date.now() - start }
    } catch (error) {
        return {
            status: "down",
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : "unknown error",
        }
    }
}

export async function GET() {
    const [db, cache] = await Promise.all([
        probe(() => basePrisma.$queryRaw`SELECT 1`),
        probe(() => redis.ping()),
    ])

    const checks = { db, cache }

    // Database is critical; Redis degrades gracefully.
    const status = db.status === "down" ? "error" : cache.status === "down" ? "degraded" : "ok"
    const httpStatus = status === "error" ? 503 : 200

    return NextResponse.json(
        {
            status,
            checks,
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "0.1.0",
        },
        { status: httpStatus }
    )
}
