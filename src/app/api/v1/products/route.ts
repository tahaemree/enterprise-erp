import { NextResponse } from "next/server"
import { basePrisma, getTenantPrisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getApiKeyPrefix, verifyApiKey } from "@/lib/api-key"
import logger from "@/lib/logger"

/**
 * Resolves an API token to a tenant.
 *
 * Preferred path: indexed lookup by non-secret prefix, then constant-time hash
 * verification. Falls back to the legacy plaintext column for keys that have
 * not yet been backfilled/rotated (see scripts/backfill-api-keys.ts).
 */
async function resolveTenantByApiKey(
    token: string,
): Promise<{ id: string; name: string } | null> {
    const prefix = getApiKeyPrefix(token)

    const candidate = await basePrisma.tenant.findUnique({
        where: { apiKeyPrefix: prefix },
        select: { id: true, name: true, apiKeyHash: true },
    })
    if (candidate?.apiKeyHash && verifyApiKey(token, candidate.apiKeyHash)) {
        return { id: candidate.id, name: candidate.name }
    }

    // Legacy fallback: plaintext key not yet migrated to hash storage.
    const legacy = await basePrisma.tenant.findUnique({
        where: { apiKey: token },
        select: { id: true, name: true },
    })
    return legacy ?? null
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization")
        if (!authHeader) {
            return NextResponse.json(
                { error: "Unauthorized. Missing Authorization header." },
                {
                    status: 401,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": "0",
                    },
                },
            )
        }

        const token = authHeader.replace("Bearer ", "").trim()
        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid API Key." },
                {
                    status: 401,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": "0",
                    },
                },
            )
        }

        const tenant = await resolveTenantByApiKey(token)

        if (!tenant) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid API Key." },
                {
                    status: 401,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": "0",
                    },
                },
            )
        }

        // Apply real rate limiting
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
        const rateLimitKey = `api:${tenant.id}:${ip}`
        const rateLimitResult = await checkRateLimit(rateLimitKey, {
            limit: 100,
            windowMs: 60_000,
            tenantId: tenant.id,
        })

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
                        "Retry-After": String(Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)),
                    },
                },
            )
        }

        const tenantPrisma = getTenantPrisma(tenant.id)

        const products = await tenantPrisma.product.findMany({
            where: { isActive: true },
            take: 50,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                sku: true,
                name: true,
                price: true,
                quantity: true,
                unit: true,
                createdAt: true,
            },
        })

        return NextResponse.json(
            {
                tenant: tenant.name,
                count: products.length,
                data: products,
            },
            {
                status: 200,
                headers: {
                    "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                    "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
                },
            },
        )
    } catch (error) {
        logger.error("[API_PRODUCTS_GET] Failed to fetch products", {
            module: "api",
            error: { message: error instanceof Error ? error.message : String(error) },
        })
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
