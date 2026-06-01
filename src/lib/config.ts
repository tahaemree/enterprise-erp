/**
 * Deftra — Centralized Configuration
 *
 * Single source of truth for all environment-dependent configuration.
 * All env variables are validated at import time — misconfigurations
 * crash fast at startup, not at runtime under load.
 *
 * Usage:
 *   import { config } from "@/lib/config"
 *   config.rateLimit.login.limit  // 5
 *   config.cache.dashboardTtl     // 300
 */

function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
}

function envOrThrow(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set.`)
    }
    return value
}

function envInt(key: string, defaultValue: number): number {
    const raw = process.env[key]
    if (!raw) return defaultValue
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be an integer, got: "${raw}"`)
    }
    return parsed
}

export const config = {
    /** Node environment */
    env: envOrDefault("NODE_ENV", "development") as "development" | "production" | "test",
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV !== "production",

    /** Application URL */
    appUrl: envOrDefault("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

    /** JWT / Session */
    jwt: {
        maxAge: envInt("JWT_MAX_AGE", 86400), // Default: 24 hours
    },

    /** Rate limiting */
    rateLimit: {
        login: {
            limit: envInt("LOGIN_MAX_ATTEMPTS", 5),
            windowMs: envInt("LOGIN_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 min
        },
        api: {
            limit: envInt("API_RATE_LIMIT", 100),
            windowMs: envInt("API_RATE_LIMIT_WINDOW_MS", 60_000), // 1 min
        },
        cleanupIntervalMs: envInt("RATE_LIMIT_CLEANUP_INTERVAL_MS", 300_000), // 5 min
    },

    /** Cache TTLs (seconds) */
    cache: {
        dashboardTtl: envInt("CACHE_DASHBOARD_TTL", 300), // 5 min
        productsTtl: envInt("CACHE_PRODUCTS_TTL", 60), // 1 min
        tenantPrismaTtl: envInt("CACHE_TENANT_PRISMA_TTL", 5 * 60 * 1000), // 5 min (ms)
        tenantPrismaMax: envInt("CACHE_TENANT_PRISMA_MAX", 100),
    },

    /** Pagination */
    pagination: {
        defaultPageSize: envInt("DEFAULT_PAGE_SIZE", 10),
        maxPageSize: envInt("MAX_PAGE_SIZE", 100),
    },

    /** Logging */
    logLevel: envOrDefault("LOG_LEVEL", process.env.NODE_ENV === "production" ? "info" : "debug") as "debug" | "info" | "warn" | "error",
} as const
