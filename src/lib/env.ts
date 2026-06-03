/**
 * Deftra — Validated Environment (server-only, fail-fast)
 *
 * Single source of truth for raw environment variables, with two layers:
 *
 *   1. `env` — a lenient, dev-friendly singleton parsed at import time. It
 *      applies safe defaults so local development and `next build` never crash
 *      for missing optional values.
 *
 *   2. `assertEnv()` — STRICT validation that throws on missing or weak
 *      production-critical secrets (DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY,
 *      ENCRYPTION_SALT). It is invoked exactly once at server startup from
 *      `src/instrumentation.ts`, and is skipped during the build phase so CI
 *      builds without runtime secrets still pass.
 *
 * The pure helpers (`parseEnv`, `validateRequiredSecrets`) accept an explicit
 * env object, which makes them trivial to unit test without mutating
 * `process.env`.
 *
 * ⚠️  This module reads server-only secrets and must NEVER be imported from a
 *     client component.
 */
import { z } from "zod"

/** Placeholder shipped in examples — must never reach production. */
export const DEFAULT_ENCRYPTION_KEY = "default_secret_key_needs_32_byte"

/** Minimum entropy we require from symmetric secrets, in characters. */
export const MIN_SECRET_LENGTH = 32

/**
 * Lenient schema. Optional secrets stay optional here so that importing the
 * module never throws — enforcement happens in {@link validateRequiredSecrets}.
 */
const baseSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1).optional(),
    AUTH_SECRET: z.string().optional(),
    ENCRYPTION_KEY: z.string().optional(),
    ENCRYPTION_SALT: z.string().optional(),
    REDIS_URL: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    GIB_ENVIRONMENT: z.enum(["test", "production"]).optional(),
})

export type Env = z.infer<typeof baseSchema>

/**
 * Parse and apply defaults to the raw environment. Never throws for missing
 * optional secrets — use {@link assertEnv} for production enforcement.
 */
export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
    return baseSchema.parse({
        NODE_ENV: raw.NODE_ENV,
        DATABASE_URL: raw.DATABASE_URL,
        AUTH_SECRET: raw.AUTH_SECRET,
        ENCRYPTION_KEY: raw.ENCRYPTION_KEY,
        ENCRYPTION_SALT: raw.ENCRYPTION_SALT,
        REDIS_URL: raw.REDIS_URL,
        NEXT_PUBLIC_APP_URL: raw.NEXT_PUBLIC_APP_URL,
        GIB_ENVIRONMENT: raw.GIB_ENVIRONMENT,
    })
}

/**
 * Return a list of human-readable problems with production-critical secrets.
 * An empty array means the environment is safe to boot.
 *
 * Enforcement is intentionally limited to `NODE_ENV === "production"`: local
 * development and the test runner use lightweight defaults and should not be
 * blocked, while the encryption layer still guards itself lazily on first use.
 */
export function validateRequiredSecrets(raw: NodeJS.ProcessEnv = process.env): string[] {
    const problems: string[] = []

    if (raw.NODE_ENV !== "production") return problems

    if (!raw.DATABASE_URL) {
        problems.push("DATABASE_URL is required in production.")
    }

    if (!raw.AUTH_SECRET) {
        problems.push("AUTH_SECRET is required in production.")
    } else if (raw.AUTH_SECRET.length < MIN_SECRET_LENGTH) {
        problems.push(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`)
    }

    if (!raw.ENCRYPTION_KEY) {
        problems.push("ENCRYPTION_KEY is required in production.")
    } else if (raw.ENCRYPTION_KEY === DEFAULT_ENCRYPTION_KEY) {
        problems.push("ENCRYPTION_KEY is using the insecure default value.")
    } else if (raw.ENCRYPTION_KEY.length < MIN_SECRET_LENGTH) {
        problems.push(`ENCRYPTION_KEY must be at least ${MIN_SECRET_LENGTH} characters.`)
    }

    if (!raw.ENCRYPTION_SALT) {
        problems.push("ENCRYPTION_SALT is required in production.")
    }

    return problems
}

/**
 * Fail-fast guard for production secrets. Throws a single, actionable error
 * listing every problem at once so operators fix the environment in one pass.
 */
export function assertEnv(raw: NodeJS.ProcessEnv = process.env): void {
    const problems = validateRequiredSecrets(raw)
    if (problems.length === 0) return

    throw new Error(
        "Invalid production environment configuration:\n" +
            problems.map((p) => `  • ${p}`).join("\n") +
            '\n\nGenerate a secure value with:\n' +
            "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
}

/** Lenient, dev-friendly singleton. Safe to import anywhere on the server. */
export const env: Env = parseEnv()
