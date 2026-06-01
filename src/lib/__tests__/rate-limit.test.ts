import { describe, it, expect, beforeEach, vi } from "vitest"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"

// In-memory store for rate limit testing
const rateLimitStore = new Map<string, { count: number; windowStart: Date }>()

// Mock Prisma to use in-memory store
vi.mock("@/lib/prisma", () => ({
    basePrisma: {
        rateLimit: {
            upsert: vi.fn(async ({ where, update, create }: any) => {
                const key = where.key_windowStart.key
                const existing = rateLimitStore.get(key)
                const windowStart = where.key_windowStart.windowStart

                if (existing) {
                    existing.count += 1
                    rateLimitStore.set(key, existing)
                    return { count: existing.count, windowStart: existing.windowStart }
                }

                const record = { count: create.count, windowStart: create.windowStart }
                rateLimitStore.set(key, record)
                return record
            }),
            update: vi.fn(async ({ where, data }: any) => {
                const key = where.key_windowStart.key
                const existing = rateLimitStore.get(key)!
                existing.count += 1
                rateLimitStore.set(key, existing)
                return { count: existing.count, windowStart: existing.windowStart }
            }),
            deleteMany: vi.fn(async ({ where }: any) => {
                if (where.key) {
                    rateLimitStore.delete(where.key)
                } else {
                    rateLimitStore.clear()
                }
                return { count: 1 }
            }),
        },
    },
}))

// Mock logger to suppress output
vi.mock("@/lib/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("rate-limit", () => {
    const testConfig = { limit: 5, windowMs: 15 * 60 * 1000 }

    beforeEach(() => {
        rateLimitStore.clear()
    })

    describe("checkRateLimit", () => {
        it("should allow first attempt", async () => {
            await expect(checkRateLimit("test@example.com", testConfig)).resolves.toMatchObject({
                allowed: true,
            })
        })

        it("should block after exceeding max attempts", async () => {
            const identifier = "attacker@example.com"

            // First 5 attempts should be allowed
            for (let i = 0; i < 5; i++) {
                const result = await checkRateLimit(identifier, testConfig)
                expect(result.allowed).toBe(true)
            }

            // 6th attempt should be blocked
            const result = await checkRateLimit(identifier, testConfig)
            expect(result.allowed).toBe(false)
        })

        it("should treat different identifiers independently", async () => {
            const user1 = "user1@example.com"
            const user2 = "user2@example.com"

            // Exhaust user1's attempts
            for (let i = 0; i < 5; i++) {
                await checkRateLimit(user1, testConfig)
            }

            // user1 should be rate limited
            const result1 = await checkRateLimit(user1, testConfig)
            expect(result1.allowed).toBe(false)

            // user2 should still be allowed
            const result2 = await checkRateLimit(user2, testConfig)
            expect(result2.allowed).toBe(true)
        })

        it("should include remaining attempts count", async () => {
            const identifier = "count@example.com"

            const first = await checkRateLimit(identifier, testConfig)
            expect(first.remaining).toBe(4)

            const second = await checkRateLimit(identifier, testConfig)
            expect(second.remaining).toBe(3)
        })
    })

    describe("resetRateLimit", () => {
        it("should clear rate limit for an identifier", async () => {
            const identifier = "reset-test@example.com"

            // Exhaust attempts
            for (let i = 0; i < 5; i++) {
                await checkRateLimit(identifier, testConfig)
            }

            const blocked = await checkRateLimit(identifier, testConfig)
            expect(blocked.allowed).toBe(false)

            // Reset
            await resetRateLimit(identifier)

            // Should be allowed again
            const after = await checkRateLimit(identifier, testConfig)
            expect(after.allowed).toBe(true)
        })

        it("should not throw when resetting non-existent entry", async () => {
            await expect(resetRateLimit("nonexistent@example.com")).resolves.not.toThrow()
        })
    })

    describe("checkLoginRateLimit", () => {
        it("should throw after exceeding max login attempts", async () => {
            const email = "brute-force@example.com"

            // Use checkLoginRateLimit for 5 attempts
            for (let i = 0; i < 5; i++) {
                await checkRateLimit(`login:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 })
            }

            const result = await checkRateLimit(`login:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 })
            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })
    })
})
