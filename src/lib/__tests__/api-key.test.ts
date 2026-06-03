import { describe, expect, it } from "vitest"
import {
    generateApiKey,
    getApiKeyPrefix,
    hashApiKey,
    verifyApiKey,
    safeEqualHash,
    API_KEY_PREFIX_LENGTH,
} from "@/lib/api-key"

describe("generateApiKey", () => {
    it("produces a prefixed token with matching prefix and hash", () => {
        const key = generateApiKey()
        expect(key.token.startsWith("dftr_")).toBe(true)
        expect(key.prefix).toBe(key.token.slice(0, API_KEY_PREFIX_LENGTH))
        expect(key.hash).toBe(hashApiKey(key.token))
    })

    it("produces unique tokens", () => {
        const a = generateApiKey()
        const b = generateApiKey()
        expect(a.token).not.toBe(b.token)
        expect(a.hash).not.toBe(b.hash)
    })
})

describe("hashApiKey", () => {
    it("is deterministic and 64 hex chars (sha256)", () => {
        const h = hashApiKey("dftr_example")
        expect(h).toBe(hashApiKey("dftr_example"))
        expect(h).toMatch(/^[0-9a-f]{64}$/)
    })
})

describe("verifyApiKey", () => {
    it("accepts the correct token and rejects a wrong one", () => {
        const { token, hash } = generateApiKey()
        expect(verifyApiKey(token, hash)).toBe(true)
        expect(verifyApiKey(token + "x", hash)).toBe(false)
    })
})

describe("safeEqualHash", () => {
    it("returns false for mismatched or empty hashes", () => {
        expect(safeEqualHash("", "")).toBe(false)
        expect(safeEqualHash("aa", "aabb")).toBe(false)
        expect(safeEqualHash(hashApiKey("x"), hashApiKey("y"))).toBe(false)
    })

    it("returns true for identical hashes", () => {
        const h = hashApiKey("same")
        expect(safeEqualHash(h, h)).toBe(true)
    })
})

describe("getApiKeyPrefix", () => {
    it("returns the configured number of leading chars", () => {
        expect(getApiKeyPrefix("dftr_abcdefghijklmnop")).toHaveLength(API_KEY_PREFIX_LENGTH)
    })
})
