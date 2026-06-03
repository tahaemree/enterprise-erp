import crypto from "crypto"

/**
 * API key generation & verification.
 *
 * SECURITY: API keys are NEVER stored in plaintext. We store:
 *   - `apiKeyPrefix`: a short, non-secret prefix used for an O(1) indexed lookup.
 *   - `apiKeyHash`:   the SHA-256 hash of the full token, compared in constant time.
 *
 * The full token is shown to the user exactly once, at creation time. If it is
 * lost it must be rotated, never recovered. This means a database leak exposes
 * only hashes, not usable credentials.
 */

const TOKEN_PREFIX = "dftr_"
/** Number of leading characters used as the indexed lookup prefix. */
export const API_KEY_PREFIX_LENGTH = 12

export interface GeneratedApiKey {
    /** The full secret token — show to the user ONCE, then discard. */
    token: string
    /** Public, indexable prefix stored in `Tenant.apiKeyPrefix`. */
    prefix: string
    /** SHA-256 hash stored in `Tenant.apiKeyHash`. */
    hash: string
}

/**
 * Generates a new cryptographically-random API key.
 */
export function generateApiKey(): GeneratedApiKey {
    const secret = crypto.randomBytes(24).toString("base64url")
    const token = `${TOKEN_PREFIX}${secret}`
    return {
        token,
        prefix: getApiKeyPrefix(token),
        hash: hashApiKey(token),
    }
}

/**
 * Returns the indexable prefix of a token.
 */
export function getApiKeyPrefix(token: string): string {
    return token.slice(0, API_KEY_PREFIX_LENGTH)
}

/**
 * Returns the SHA-256 hex hash of a token.
 */
export function hashApiKey(token: string): string {
    return crypto.createHash("sha256").update(token, "utf8").digest("hex")
}

/**
 * Constant-time comparison of two hex-encoded hashes. Prevents timing attacks.
 */
export function safeEqualHash(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "hex")
    const bufB = Buffer.from(b, "hex")
    if (bufA.length !== bufB.length || bufA.length === 0) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verifies a presented token against a stored hash in constant time.
 */
export function verifyApiKey(token: string, storedHash: string): boolean {
    return safeEqualHash(hashApiKey(token), storedHash)
}
