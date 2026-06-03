import { describe, expect, it } from "vitest"
import {
    DEFAULT_ENCRYPTION_KEY,
    MIN_SECRET_LENGTH,
    assertEnv,
    parseEnv,
    validateRequiredSecrets,
} from "@/lib/env"

/** A complete, valid set of production secrets for the happy path. */
const validProdEnv = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    AUTH_SECRET: "x".repeat(MIN_SECRET_LENGTH),
    ENCRYPTION_KEY: "k".repeat(MIN_SECRET_LENGTH),
    ENCRYPTION_SALT: "some-unique-salt",
} as unknown as NodeJS.ProcessEnv

describe("parseEnv", () => {
    it("defaults NODE_ENV to development when unset", () => {
        expect(parseEnv({} as NodeJS.ProcessEnv).NODE_ENV).toBe("development")
    })

    it("never throws for missing optional secrets", () => {
        expect(() => parseEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).not.toThrow()
    })

    it("rejects a malformed NEXT_PUBLIC_APP_URL", () => {
        expect(() =>
            parseEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" } as unknown as NodeJS.ProcessEnv)
        ).toThrow()
    })
})

describe("validateRequiredSecrets", () => {
    it("returns no problems outside production even with empty env", () => {
        expect(validateRequiredSecrets({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toEqual([])
        expect(validateRequiredSecrets({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toEqual([])
    })

    it("returns no problems for a fully valid production env", () => {
        expect(validateRequiredSecrets(validProdEnv)).toEqual([])
    })

    it("flags every missing secret in production", () => {
        const problems = validateRequiredSecrets({ NODE_ENV: "production" } as NodeJS.ProcessEnv)
        expect(problems).toHaveLength(4)
        expect(problems.join("\n")).toMatch(/DATABASE_URL/)
        expect(problems.join("\n")).toMatch(/AUTH_SECRET/)
        expect(problems.join("\n")).toMatch(/ENCRYPTION_KEY/)
        expect(problems.join("\n")).toMatch(/ENCRYPTION_SALT/)
    })

    it("flags the insecure default encryption key", () => {
        const problems = validateRequiredSecrets({
            ...validProdEnv,
            ENCRYPTION_KEY: DEFAULT_ENCRYPTION_KEY,
        } as NodeJS.ProcessEnv)
        expect(problems).toContain("ENCRYPTION_KEY is using the insecure default value.")
    })

    it("flags secrets that are too short", () => {
        const problems = validateRequiredSecrets({
            ...validProdEnv,
            AUTH_SECRET: "short",
            ENCRYPTION_KEY: "short",
        } as NodeJS.ProcessEnv)
        expect(problems.some((p) => /AUTH_SECRET.*at least/.test(p))).toBe(true)
        expect(problems.some((p) => /ENCRYPTION_KEY.*at least/.test(p))).toBe(true)
    })
})

describe("assertEnv", () => {
    it("does not throw for a valid production env", () => {
        expect(() => assertEnv(validProdEnv)).not.toThrow()
    })

    it("does not throw outside production", () => {
        expect(() => assertEnv({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).not.toThrow()
    })

    it("throws a single aggregated, actionable error listing all problems", () => {
        expect(() => assertEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(
            /Invalid production environment configuration/
        )
        try {
            assertEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv)
        } catch (e) {
            const message = (e as Error).message
            expect(message).toMatch(/DATABASE_URL/)
            expect(message).toMatch(/randomBytes/) // remediation hint
        }
    })
})
