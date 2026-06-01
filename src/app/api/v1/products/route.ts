import { NextResponse } from "next/server"
import { basePrisma, getTenantPrisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import logger from "@/lib/logger"

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

        // Use basePrisma singleton — no new PrismaClient() leak
        const tenant = await basePrisma.tenant.findUnique({
            where: { apiKey: token },
            select: { id: true, name: true },
        })

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
