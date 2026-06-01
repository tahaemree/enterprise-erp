import { NextResponse } from "next/server"
import { basePrisma } from "@/lib/prisma"

/**
 * Health check endpoint for load balancers, Kubernetes probes, and monitoring.
 *
 * GET /api/health
 *
 * Returns:
 *   200 — { status: "ok", db: "connected", uptime: ..., timestamp: ... }
 *   503 — { status: "error", db: "disconnected", error: "..." }
 */
export async function GET() {
    const start = Date.now()

    try {
        // Check database connectivity with a lightweight query
        await basePrisma.$queryRaw`SELECT 1`
        const dbLatency = Date.now() - start

        return NextResponse.json(
            {
                status: "ok",
                db: "connected",
                dbLatencyMs: dbLatency,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || "0.1.0",
            },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                db: "disconnected",
                error: error instanceof Error ? error.message : "Unknown database error",
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        )
    }
}
