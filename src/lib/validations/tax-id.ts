import { z } from "zod"

/**
 * Turkish tax-identity validation.
 *
 *  - VKN  (Vergi Kimlik Numarası): 10 digits, used by legal entities.
 *  - TCKN (T.C. Kimlik Numarası):  11 digits, used by individuals.
 *
 * Both have official checksum algorithms published by the relevant authorities
 * (GİB for VKN, NVİ for TCKN). Validating the checksum — not just the length —
 * is required before submitting e-Belge (e-Fatura / e-Arşiv / e-İrsaliye) and
 * BA/BS forms, because GİB rejects documents with structurally invalid IDs.
 */

/**
 * Validates a 10-digit VKN using the official GİB checksum algorithm.
 */
export function isValidVKN(value: string): boolean {
    if (!/^\d{10}$/.test(value)) return false

    const digits = value.split("").map(Number)
    let sum = 0

    for (let i = 0; i < 9; i++) {
        const tmp = (digits[i]! + (9 - i)) % 10
        sum += tmp === 9 ? tmp : (tmp * Math.pow(2, 9 - i)) % 9
    }

    const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10)
    return checkDigit === digits[9]
}

/**
 * Validates an 11-digit TCKN using the official NVİ checksum algorithm.
 */
export function isValidTCKN(value: string): boolean {
    // First digit cannot be 0.
    if (!/^[1-9]\d{10}$/.test(value)) return false

    const d = value.split("").map(Number)
    const sumOdd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!
    const sumEven = d[1]! + d[3]! + d[5]! + d[7]!

    // 10th digit: ((sumOdd * 7) - sumEven) mod 10
    const tenth = (((sumOdd * 7 - sumEven) % 10) + 10) % 10
    if (tenth !== d[9]) return false

    // 11th digit: (sum of first 10 digits) mod 10
    const eleventh = (sumOdd + sumEven + d[9]!) % 10
    return eleventh === d[10]
}

/**
 * Returns true if the value is a valid VKN (10 digits) OR TCKN (11 digits).
 */
export function isValidTaxId(value: string): boolean {
    return isValidVKN(value) || isValidTCKN(value)
}

// ─── Zod schemas ────────────────────────────────────────────────────────────

const TAX_ID_MESSAGE = "Geçerli bir VKN (10 hane) veya TCKN (11 hane) giriniz"

/** Strict VKN-only schema. */
export const vknSchema = z
    .string()
    .trim()
    .refine(isValidVKN, { message: "Geçerli bir VKN (10 hane) giriniz" })

/** Strict TCKN-only schema. */
export const tcknSchema = z
    .string()
    .trim()
    .refine(isValidTCKN, { message: "Geçerli bir TCKN (11 hane) giriniz" })

/** Accepts either a valid VKN or TCKN. */
export const taxIdSchema = z
    .string()
    .trim()
    .refine(isValidTaxId, { message: TAX_ID_MESSAGE })

/** Optional variant: empty string / undefined is allowed, otherwise must be valid. */
export const taxIdOptionalSchema = z
    .string()
    .trim()
    .refine((v) => v === "" || isValidTaxId(v), { message: TAX_ID_MESSAGE })
    .optional()
