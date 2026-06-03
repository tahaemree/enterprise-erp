import { describe, expect, it } from "vitest"
import {
    isValidVKN,
    isValidTCKN,
    isValidTaxId,
    taxIdSchema,
    taxIdOptionalSchema,
} from "@/lib/validations/tax-id"

describe("isValidVKN", () => {
    it("accepts a checksum-valid VKN", () => {
        expect(isValidVKN("1234567890")).toBe(true)
    })

    it("rejects a VKN with an invalid checksum", () => {
        expect(isValidVKN("9876543210")).toBe(false)
        expect(isValidVKN("1234567891")).toBe(false)
    })

    it("rejects wrong length / non-numeric", () => {
        expect(isValidVKN("123456789")).toBe(false) // 9 digits
        expect(isValidVKN("12345678901")).toBe(false) // 11 digits
        expect(isValidVKN("12345abcde")).toBe(false)
        expect(isValidVKN("")).toBe(false)
    })
})

describe("isValidTCKN", () => {
    it("accepts a checksum-valid TCKN", () => {
        expect(isValidTCKN("10000000146")).toBe(true)
    })

    it("rejects a TCKN with an invalid checksum", () => {
        expect(isValidTCKN("10000000140")).toBe(false)
        expect(isValidTCKN("12345678901")).toBe(false)
    })

    it("rejects a TCKN starting with 0", () => {
        expect(isValidTCKN("01000000146")).toBe(false)
    })

    it("rejects wrong length", () => {
        expect(isValidTCKN("1000000014")).toBe(false) // 10 digits
        expect(isValidTCKN("")).toBe(false)
    })
})

describe("isValidTaxId", () => {
    it("accepts both a valid VKN and a valid TCKN", () => {
        expect(isValidTaxId("1234567890")).toBe(true)
        expect(isValidTaxId("10000000146")).toBe(true)
    })

    it("rejects an invalid value", () => {
        expect(isValidTaxId("0000000000")).toBe(false)
    })
})

describe("taxIdSchema", () => {
    it("parses a valid VKN", () => {
        expect(taxIdSchema.safeParse("1234567890").success).toBe(true)
    })

    it("trims surrounding whitespace before validating", () => {
        expect(taxIdSchema.safeParse("  1234567890  ").success).toBe(true)
    })

    it("rejects an invalid id", () => {
        expect(taxIdSchema.safeParse("9876543210").success).toBe(false)
    })
})

describe("taxIdOptionalSchema", () => {
    it("allows empty string and undefined", () => {
        expect(taxIdOptionalSchema.safeParse("").success).toBe(true)
        expect(taxIdOptionalSchema.safeParse(undefined).success).toBe(true)
    })

    it("validates a non-empty value", () => {
        expect(taxIdOptionalSchema.safeParse("1234567890").success).toBe(true)
        expect(taxIdOptionalSchema.safeParse("123").success).toBe(false)
    })
})
