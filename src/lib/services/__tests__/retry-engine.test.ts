import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    classifyError,
    classifyErrorFromMessage,
    calculateDelay,
    withRetry,
    submitWithRetry,
    formatRetrySummary,
    determineInvoiceStatus,
    DEFAULT_RETRY_CONFIG,
    type RetryConfig,
    type RetryResult,
} from "@/lib/services/retry-engine"

// ==================== classifyError ====================

describe("classifyError", () => {
    it("should classify known GIB-001 as retryable SERVER error", () => {
        const result = classifyError("GIB-001")
        expect(result.category).toBe("SERVER")
        expect(result.isRetryable).toBe(true)
        expect(result.code).toBe("GIB-001")
    })

    it("should classify known GIB-003 as non-retryable AUTH error", () => {
        const result = classifyError("GIB-003")
        expect(result.category).toBe("AUTH")
        expect(result.isRetryable).toBe(false)
    })

    it("should classify known GIB-100 as non-retryable VALIDATION error", () => {
        const result = classifyError("GIB-100")
        expect(result.category).toBe("VALIDATION")
        expect(result.isRetryable).toBe(false)
    })

    it("should classify known GIB-200 as retryable TIMEOUT error", () => {
        const result = classifyError("GIB-200")
        expect(result.category).toBe("TIMEOUT")
        expect(result.isRetryable).toBe(true)
    })

    it("should classify known INT-001 as retryable NETWORK error", () => {
        const result = classifyError("INT-001")
        expect(result.category).toBe("NETWORK")
        expect(result.isRetryable).toBe(true)
    })

    it("should classify known INT-003 as non-retryable AUTH error", () => {
        const result = classifyError("INT-003")
        expect(result.category).toBe("AUTH")
        expect(result.isRetryable).toBe(false)
    })

    it("should use provided message when given", () => {
        const result = classifyError("GIB-001", "Özel hata mesajı")
        expect(result.message).toBe("Özel hata mesajı")
    })

    it("should use default message when no message provided", () => {
        const result = classifyError("GIB-001")
        expect(result.message).toBe("GİB servisi geçici olarak kullanılamıyor")
    })

    it("should classify unknown 5xx codes as retryable SERVER", () => {
        const result = classifyError("500", "Internal server error")
        expect(result.category).toBe("SERVER")
        expect(result.isRetryable).toBe(true)
        expect(result.message).toBe("Internal server error")
    })

    it("should classify unknown 4xx codes as non-retryable VALIDATION", () => {
        const result = classifyError("400", "Bad request")
        expect(result.category).toBe("VALIDATION")
        expect(result.isRetryable).toBe(false)
    })

    it("should classify unrecognized codes as UNKNOWN non-retryable", () => {
        const result = classifyError("ABC-999", "Some unknown error")
        expect(result.category).toBe("UNKNOWN")
        expect(result.isRetryable).toBe(false)
        expect(result.message).toBe("Some unknown error")
    })
})

// ==================== classifyErrorFromMessage ====================

describe("classifyErrorFromMessage", () => {
    it("should detect timeout from Turkish message", () => {
        const result = classifyErrorFromMessage("zaman aşımı hatası")
        expect(result.category).toBe("TIMEOUT")
        expect(result.isRetryable).toBe(true)
    })

    it("should detect timeout from English message", () => {
        const result = classifyErrorFromMessage("Connection timeout")
        expect(result.category).toBe("TIMEOUT")
        expect(result.isRetryable).toBe(true)
    })

    it("should detect network error from ECONNREFUSED", () => {
        const result = classifyErrorFromMessage("ECONNREFUSED: connection refused")
        expect(result.category).toBe("NETWORK")
        expect(result.isRetryable).toBe(true)
    })

    it("should detect auth error from 401", () => {
        const result = classifyErrorFromMessage("401 Unauthorized")
        expect(result.category).toBe("AUTH")
        expect(result.isRetryable).toBe(false)
    })

    it("should detect auth error from 'mühür' keyword", () => {
        const result = classifyErrorFromMessage("Mali mühür geçersiz")
        expect(result.category).toBe("AUTH")
        expect(result.isRetryable).toBe(false)
    })

    it("should detect validation error from 'geçersiz' keyword", () => {
        const result = classifyErrorFromMessage("Geçersiz XML şeması")
        expect(result.category).toBe("VALIDATION")
        expect(result.isRetryable).toBe(false)
    })

    it("should detect server error from 500", () => {
        const result = classifyErrorFromMessage("500 Internal Server Error")
        expect(result.category).toBe("SERVER")
        expect(result.isRetryable).toBe(true)
    })

    it("should detect server error from 'sunucu' keyword", () => {
        const result = classifyErrorFromMessage("Sunucu hatası meydana geldi")
        expect(result.category).toBe("SERVER")
        expect(result.isRetryable).toBe(true)
    })

    it("should default to UNKNOWN non-retryable for unrecognized messages", () => {
        const result = classifyErrorFromMessage("Bir şey oldu")
        expect(result.category).toBe("UNKNOWN")
        expect(result.isRetryable).toBe(false)
    })
})

// ==================== calculateDelay ====================

describe("calculateDelay", () => {
    it("should return base delay for first attempt", () => {
        const delay = calculateDelay(1)
        // Jitter: 1000 ± 25% => 750-1250
        expect(delay).toBeGreaterThanOrEqual(750)
        expect(delay).toBeLessThanOrEqual(1250)
    })

    it("should double delay for second attempt (exponential backoff)", () => {
        const delay = calculateDelay(2)
        // base 1000 * 2^1 = 2000 ± 25% => 1500-2500
        expect(delay).toBeGreaterThanOrEqual(1500)
        expect(delay).toBeLessThanOrEqual(2500)
    })

    it("should quadruple delay for third attempt", () => {
        const delay = calculateDelay(3)
        // base 1000 * 2^2 = 4000 ± 25% => 3000-5000
        expect(delay).toBeGreaterThanOrEqual(3000)
        expect(delay).toBeLessThanOrEqual(5000)
    })

    it("should respect max delay", () => {
        const config: RetryConfig = {
            ...DEFAULT_RETRY_CONFIG,
            baseDelayMs: 10000,
            backoffMultiplier: 10,
            maxDelayMs: 15000,
        }
        const delay = calculateDelay(3, config)
        // 10000 * 10^2 = 1,000,000 but max is 15000, then jitter
        expect(delay).toBeGreaterThanOrEqual(11250)
        expect(delay).toBeLessThanOrEqual(18750)
    })

    it("should support custom config", () => {
        const config: RetryConfig = {
            maxRetries: 5,
            baseDelayMs: 500,
            backoffMultiplier: 3,
            maxDelayMs: 10000,
            retryableCategories: ["NETWORK", "TIMEOUT"],
        }
        const delay = calculateDelay(1, config)
        // 500 ± 25% => 375-625
        expect(delay).toBeGreaterThanOrEqual(375)
        expect(delay).toBeLessThanOrEqual(625)
    })
})

// ==================== withRetry ====================

describe("withRetry", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("should succeed on first attempt", async () => {
        const operation = vi.fn().mockResolvedValue("success")

        const promise = withRetry(operation, { maxRetries: 3, baseDelayMs: 100, backoffMultiplier: 1, maxDelayMs: 1000, retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"] })
        vi.advanceTimersToNextTimer()

        const result = await promise
        expect(result.success).toBe(true)
        expect(result.data).toBe("success")
        expect(result.attempts).toHaveLength(0)
        expect(operation).toHaveBeenCalledTimes(1)
    })

    it("should retry on retryable error and succeed", async () => {
        const operation = vi.fn()
            .mockRejectedValueOnce(new Error("Connection timeout"))
            .mockRejectedValueOnce(new Error("Server busy"))
            .mockResolvedValueOnce("success")

        const promise = withRetry(operation, { maxRetries: 3, baseDelayMs: 100, backoffMultiplier: 1, maxDelayMs: 1000, retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"] })
        // Advance past all retries
        await vi.advanceTimersByTimeAsync(5000)

        const result = await promise
        expect(result.success).toBe(true)
        expect(result.data).toBe("success")
        expect(result.attempts).toHaveLength(2)
        expect(operation).toHaveBeenCalledTimes(3)
    })

    it("should fail after exhausting all retries", async () => {
        const operation = vi.fn().mockRejectedValue(new Error("Connection timeout"))

        const promise = withRetry(operation, { maxRetries: 3, baseDelayMs: 100, backoffMultiplier: 1, maxDelayMs: 1000, retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"] })
        await vi.advanceTimersByTimeAsync(5000)

        const result = await promise
        expect(result.success).toBe(false)
        expect(result.attempts).toHaveLength(3)
        expect(operation).toHaveBeenCalledTimes(3)
    })

    it("should fail immediately on non-retryable error", async () => {
        const operation = vi.fn().mockRejectedValue(new Error("Validation failed: invalid schema"))

        const promise = withRetry(operation, { maxRetries: 3, baseDelayMs: 100, backoffMultiplier: 1, maxDelayMs: 1000, retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"] })

        const result = await promise
        expect(result.success).toBe(false)
        expect(result.attempts).toHaveLength(1)
        expect(operation).toHaveBeenCalledTimes(1)
        expect(result.error?.category).toBe("VALIDATION")
        expect(result.error?.isRetryable).toBe(false)
    })
})

// ==================== submitWithRetry ====================

describe("submitWithRetry", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("should use merged config with defaults", async () => {
        const operation = vi.fn().mockResolvedValue("ok")

        const promise = submitWithRetry(operation, { maxRetries: 2, baseDelayMs: 100, backoffMultiplier: 1, maxDelayMs: 1000 })

        const result = await promise
        expect(result.success).toBe(true)
    })
})

// ==================== formatRetrySummary ====================

describe("formatRetrySummary", () => {
    it("should format success summary", () => {
        const result: RetryResult<string> = {
            success: true,
            data: "ok",
            attempts: [{ attempt: 1, timestamp: new Date(), error: { category: "NETWORK", code: "ERR_NETWORK", message: "timeout", isRetryable: true }, delayMs: 1000 }],
            totalDurationMs: 1500,
        }
        const summary = formatRetrySummary(result)
        expect(summary).toContain("✅")
        expect(summary).toContain("başarılı")
        expect(summary).toContain("1500ms")
    })

    it("should format failure summary with error details", () => {
        const result: RetryResult<null> = {
            success: false,
            data: undefined,
            error: { category: "VALIDATION", code: "GIB-100", message: "XML şeması geçersiz", isRetryable: false },
            attempts: [
                { attempt: 1, timestamp: new Date(), error: { category: "VALIDATION", code: "GIB-100", message: "XML şeması geçersiz", isRetryable: false }, delayMs: 0 },
            ],
            totalDurationMs: 500,
        }
        const summary = formatRetrySummary(result)
        expect(summary).toContain("❌")
        expect(summary).toContain("başarısız")
        expect(summary).toContain("[GIB-100]")
        expect(summary).toContain("VALIDATION")
        expect(summary).toContain("Hayır") // not retryable
    })

    it("should include all attempt details", () => {
        const result: RetryResult<null> = {
            success: false,
            attempts: [
                { attempt: 1, timestamp: new Date(), error: { category: "NETWORK", code: "ERR_NETWORK", message: "timeout", isRetryable: true }, delayMs: 1000 },
                { attempt: 2, timestamp: new Date(), error: { category: "NETWORK", code: "ERR_NETWORK", message: "timeout", isRetryable: true }, delayMs: 2000 },
            ],
            totalDurationMs: 3500,
        }
        const summary = formatRetrySummary(result)
        expect(summary).toContain("#1")
        expect(summary).toContain("#2")
    })
})

// ==================== determineInvoiceStatus ====================

describe("determineInvoiceStatus", () => {
    it("should return GIB_ACCEPTED on success", () => {
        const result: RetryResult<unknown> = {
            success: true,
            data: {},
            attempts: [],
            totalDurationMs: 100,
        }
        expect(determineInvoiceStatus(result)).toBe("GIB_ACCEPTED")
    })

    it("should return ERROR for failure with retryable error", () => {
        const result: RetryResult<unknown> = {
            success: false,
            error: { category: "NETWORK", code: "ERR_NETWORK", message: "timeout", isRetryable: true },
            attempts: [],
            totalDurationMs: 100,
        }
        expect(determineInvoiceStatus(result)).toBe("ERROR")
    })

    it("should return GIB_REJECTED for failure with non-retryable error", () => {
        const result: RetryResult<unknown> = {
            success: false,
            error: { category: "VALIDATION", code: "GIB-100", message: "invalid", isRetryable: false },
            attempts: [],
            totalDurationMs: 100,
        }
        expect(determineInvoiceStatus(result)).toBe("GIB_REJECTED")
    })
})
