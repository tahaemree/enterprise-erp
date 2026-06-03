import crypto from 'crypto'
import logger from '@/lib/logger'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * When ENCRYPTION_STRICT=true, decrypt() refuses to pass through unencrypted
 * data. Operators enable this after backfilling legacy rows to permanently
 * close the plaintext-fallback path (KVKK compliance). Read lazily so the flag
 * can be toggled per-process without re-importing the module.
 */
function isStrictEncryption(): boolean {
    return process.env.ENCRYPTION_STRICT === 'true'
}

/**
 * Derives a proper 256-bit key from the ENCRYPTION_KEY env variable.
 * Uses HKDF-like derivation via crypto.scryptSync for production-grade key derivation.
 *
 * In production, ENCRYPTION_KEY MUST be set to a secure random string (min 32 chars).
 * The app will fail at startup if ENCRYPTION_KEY is missing or a default is detected.
 */
function getEncryptionKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY

    if (!rawKey || rawKey === 'default_secret_key_needs_32_byte') {
        throw new Error(
            'ENCRYPTION_KEY environment variable is not set or is using the default value. ' +
            'Generate a secure key: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        )
    }

    if (rawKey.length < 32) {
        throw new Error(
            `ENCRYPTION_KEY must be at least 32 characters long (current: ${rawKey.length}). ` +
            'Generate a secure key: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        )
    }

    // Derive a fixed-length 32-byte key using scrypt (production-grade KDF)
    const salt = process.env.ENCRYPTION_SALT
    if (!salt) {
        throw new Error(
            'ENCRYPTION_SALT environment variable is not set. ' +
            'Set a unique salt for your deployment to ensure key derivation security.'
        )
    }
    return crypto.scryptSync(rawKey, salt, KEY_LENGTH)
}

let _encryptionKey: Buffer | null = null

function getKey(): Buffer {
    if (!_encryptionKey) {
        _encryptionKey = getEncryptionKey()
    }
    return _encryptionKey
}

/**
 * Encrypts text using AES-256-GCM.
 * Returns a colon-delimited string: iv:authTag:ciphertext (all hex-encoded).
 * Returns null for null/undefined input.
 * Throws on encryption failure — never silently returns plaintext.
 */
export function encrypt(text: string | null | undefined): string | null {
    if (text == null) return null
    if (text === "") return null // Empty string has nothing to encrypt

    try {
        const key = getKey()
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        const authTag = cipher.getAuthTag()

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
        logger.error('Encryption failed', {
            module: 'encryption',
            error: { message: error instanceof Error ? error.message : String(error) },
        })
        throw new Error('Failed to encrypt sensitive data')
    }
}

/**
 * Decrypts text that was encrypted with encrypt().
 * Expects the colon-delimited format: iv:authTag:ciphertext.
 * Returns null for null/undefined input.
 * If the text is not in encrypted format (e.g., legacy seed data),
 * logs a warning and returns the plaintext as-is.
 * Throws on actual decryption failure — never returns garbled data.
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
    if (encryptedText == null) return null
    if (!encryptedText.includes(':') || encryptedText.split(':').length !== 3) {
        // Data not in encrypted format (e.g., legacy seed data, migration).
        //
        // Backward-compat fallback returns the plaintext as-is. This is a KVKK
        // risk because it lets unencrypted PII flow silently. After backfilling
        // existing rows, operators set ENCRYPTION_STRICT=true to CLOSE this path
        // so any remaining unencrypted value is treated as corruption, not data.
        if (isStrictEncryption()) {
            logger.error('Encountered unencrypted data while ENCRYPTION_STRICT is enabled', {
                module: 'encryption',
                hint: 'Backfill/encrypt legacy rows, or disable ENCRYPTION_STRICT to tolerate plaintext.',
            })
            throw new Error('Unencrypted data encountered while strict encryption is enabled')
        }
        logger.warn('Data is not in encrypted format (expected iv:authTag:ciphertext), returning plaintext', {
            module: 'encryption',
            hint: 'This data was likely stored before encryption was enabled',
        })
        return encryptedText
    }

    try {
        const key = getKey()
        const parts = encryptedText.split(':')
        const [ivHex, authTagHex, encrypted] = parts

        if (!ivHex || !authTagHex || !encrypted) {
            throw new Error('Malformed encrypted text (missing parts)')
        }

        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')

        if (iv.length !== IV_LENGTH) {
            throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`)
        }
        if (authTag.length !== AUTH_TAG_LENGTH) {
            throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`)
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        logger.error('Decryption failed', {
            module: 'encryption',
            error: { message: error instanceof Error ? error.message : String(error) },
        })
        throw new Error('Failed to decrypt sensitive data')
    }
}
