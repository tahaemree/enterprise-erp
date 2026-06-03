import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { decrypt } from "@/lib/encryption"

describe("decrypt() legacy plaintext fallback", () => {
    afterEach(() => {
        delete process.env.ENCRYPTION_STRICT
    })

    it("returns null for null input regardless of mode", () => {
        expect(decrypt(null)).toBeNull()
        expect(decrypt(undefined)).toBeNull()
    })

    it("passes non-encrypted data through when strict mode is off (default)", () => {
        delete process.env.ENCRYPTION_STRICT
        expect(decrypt("legacy-plaintext")).toBe("legacy-plaintext")
    })

    it("throws on non-encrypted data when ENCRYPTION_STRICT=true (KVKK closure)", () => {
        process.env.ENCRYPTION_STRICT = "true"
        expect(() => decrypt("legacy-plaintext")).toThrow(/strict encryption/i)
    })
})
