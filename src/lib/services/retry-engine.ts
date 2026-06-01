/**
 * FAZ 4 — Hata Toleranslı Retry Sistemi
 *
 * GİB'e gönderim sırasında oluşabilecek hataları kategorize eder,
 * otomatik yeniden deneme (retry) stratejisi uygular.
 *
 * - Hata kategorizasyonu (retryable vs non-retryable)
 * - Exponential backoff ile yeniden deneme
 * - Maksimum deneme sayısı ve süre aşımı
 * - Hata geçmişi ve raporlama
 */

// ==================== TYPES ====================

export type ErrorCategory = "NETWORK" | "TIMEOUT" | "AUTH" | "VALIDATION" | "SERVER" | "UNKNOWN"

export interface RetryableError {
    category: ErrorCategory
    code: string
    message: string
    isRetryable: boolean
    retryAfter?: number // saniye cinsinden önerilen bekleme
}

export interface RetryConfig {
    /** Maksimum deneme sayısı (default: 3) */
    maxRetries: number
    /** İlk bekleme süresi (ms cinsinden, default: 1000) */
    baseDelayMs: number
    /** Bekleme süresi çarpanı (default: 2 — exponential backoff) */
    backoffMultiplier: number
    /** Maksimum bekleme süresi (ms cinsinden, default: 30000) */
    maxDelayMs: number
    /** Hangi hata kategorilerinde retry yapılacağı */
    retryableCategories: ErrorCategory[]
}

export interface RetryAttempt {
    attempt: number
    timestamp: Date
    error: RetryableError
    delayMs: number
}

export interface RetryResult<T> {
    success: boolean
    data?: T
    error?: RetryableError
    attempts: RetryAttempt[]
    totalDurationMs: number
}

// ==================== DEFAULT CONFIG ====================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 30000,
    retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"],
}

// ==================== ERROR CLASSIFICATION ====================

const GIB_ERROR_MAP: Record<string, { category: ErrorCategory; isRetryable: boolean; message: string }> = {
    // GİB servis hataları
    "GIB-001": { category: "SERVER", isRetryable: true, message: "GİB servisi geçici olarak kullanılamıyor" },
    "GIB-002": { category: "NETWORK", isRetryable: true, message: "GİB bağlantı zaman aşımı" },
    "GIB-003": { category: "AUTH", isRetryable: false, message: "Geçersiz mali mühür / e-imza" },

    // Doğrulama hataları
    "GIB-100": { category: "VALIDATION", isRetryable: false, message: "XML şeması geçersiz" },
    "GIB-101": { category: "VALIDATION", isRetryable: false, message: "VKN/TCKN doğrulaması başarısız" },
    "GIB-102": { category: "VALIDATION", isRetryable: false, message: "Mükellefiyet kapsam dışı" },
    "GIB-103": { category: "VALIDATION", isRetryable: false, message: "Fatura numarası daha önce kullanılmış" },
    "GIB-104": { category: "VALIDATION", isRetryable: false, message: "UUID daha önce kullanılmış" },

    // Zaman aşımı
    "GIB-200": { category: "TIMEOUT", isRetryable: true, message: "GİB yanıt vermiyor — zaman aşımı" },
    "GIB-201": { category: "TIMEOUT", isRetryable: true, message: "Gönderim zaman aşımına uğradı" },

    // Entegratör hataları
    "INT-001": { category: "NETWORK", isRetryable: true, message: "Entegratör bağlantı hatası" },
    "INT-002": { category: "SERVER", isRetryable: true, message: "Entegratör servis hatası" },
    "INT-003": { category: "AUTH", isRetryable: false, message: "Entegratör kimlik doğrulama hatası" },
}

/**
 * GİB hata kodunu analiz ederek kategorize eder.
 */
export function classifyError(code: string, message?: string): RetryableError {
    const known = GIB_ERROR_MAP[code]
    if (known) {
        return {
            category: known.category,
            code,
            message: message || known.message,
            isRetryable: known.isRetryable,
        }
    }

    // Bilinmeyen hata kodlarını analiz et
    if (code.startsWith("5")) {
        return { category: "SERVER", code, message: message || "Sunucu hatası", isRetryable: true }
    }
    if (code.startsWith("4")) {
        return { category: "VALIDATION", code, message: message || "İstemci hatası", isRetryable: false }
    }

    return { category: "UNKNOWN", code, message: message || "Bilinmeyen hata", isRetryable: false }
}

/**
 * Hata mesajından hata kategorisini belirler (kod olmadığında).
 */
export function classifyErrorFromMessage(errorMessage: string): RetryableError {
    const lower = errorMessage.toLowerCase()

    if (lower.includes("timeout") || lower.includes("zaman aşımı") || lower.includes("timeout")) {
        return { category: "TIMEOUT", code: "ERR_TIMEOUT", message: errorMessage, isRetryable: true }
    }
    if (lower.includes("network") || lower.includes("econnrefused") || lower.includes("bağlantı")) {
        return { category: "NETWORK", code: "ERR_NETWORK", message: errorMessage, isRetryable: true }
    }
    if (lower.includes("auth") || lower.includes("mühür") || lower.includes("imza") || lower.includes("401") || lower.includes("403")) {
        return { category: "AUTH", code: "ERR_AUTH", message: errorMessage, isRetryable: false }
    }
    if (lower.includes("schema") || lower.includes("validation") || lower.includes("valid") || lower.includes("geçersiz")) {
        return { category: "VALIDATION", code: "ERR_VALIDATION", message: errorMessage, isRetryable: false }
    }
    if (lower.includes("500") || lower.includes("server") || lower.includes("sunucu")) {
        return { category: "SERVER", code: "ERR_SERVER", message: errorMessage, isRetryable: true }
    }

    return { category: "UNKNOWN", code: "ERR_UNKNOWN", message: errorMessage, isRetryable: false }
}

// ==================== RETRY MECHANISM ====================

/**
 * Hesaplanan gecikme süresi (exponential backoff + jitter).
 */
export function calculateDelay(
    attempt: number,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
    let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
    delay = Math.min(delay, config.maxDelayMs)

    // Jitter: +/- %25 rastgele sapma
    const jitter = delay * (Math.random() * 0.5 - 0.25)
    return Math.round(delay + jitter)
}

/**
 * Verilen işlemi retry mantığıyla çalıştırır.
 * - İşlem başarılı olursa sonucu döndürür
 * - Retry edilebilir hatalarda exponential backoff ile yeniden dener
 * - Retry edilemez hatalarda hemen başarısız olur
 * - Tüm denemelerin kaydını tutar
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<RetryResult<T>> {
    const attempts: RetryAttempt[] = []
    const startTime = Date.now()

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            const data = await operation()
            return {
                success: true,
                data,
                attempts,
                totalDurationMs: Date.now() - startTime,
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            const classified = classifyErrorFromMessage(errorMessage)

            const delayMs = calculateDelay(attempt, config)

            attempts.push({
                attempt,
                timestamp: new Date(),
                error: classified,
                delayMs: attempt < config.maxRetries ? delayMs : 0,
            })

            // Son deneme ise başarısız olarak dön
            if (attempt >= config.maxRetries) {
                return {
                    success: false,
                    error: classified,
                    attempts,
                    totalDurationMs: Date.now() - startTime,
                }
            }

            // Retry edilemez hataysa hemen başarısız ol
            if (!classified.isRetryable) {
                return {
                    success: false,
                    error: classified,
                    attempts,
                    totalDurationMs: Date.now() - startTime,
                }
            }

            // Exponential backoff ile bekle
            await sleep(delayMs)
        }
    }

    // Bu noktaya gelinmemeli, ama tip güvenliği için:
    return {
        success: false,
        error: { category: "UNKNOWN", code: "ERR_UNKNOWN", message: "Max retries exceeded", isRetryable: false },
        attempts,
        totalDurationMs: Date.now() - startTime,
    }
}

/**
 * GİB'e gönderme simülasyonu için retry sarmalayıcı.
 * Gerçek gönderimde bu fonksiyon API çağrısını yapar.
 */
export async function submitWithRetry<T>(
    submitFn: () => Promise<T>,
    config?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
    const mergedConfig: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    }

    return withRetry(submitFn, mergedConfig)
}

// ==================== HELPERS ====================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry sonucunu özetleyen metin döndürür.
 */
export function formatRetrySummary(result: RetryResult<unknown>): string {
    const lines: string[] = []

    if (result.success) {
        lines.push(`✅ İşlem başarılı (${result.attempts.length + 1} deneme, ${result.totalDurationMs}ms)`)
    } else {
        lines.push(`❌ İşlem başarısız (${result.attempts.length} deneme, ${result.totalDurationMs}ms)`)
        if (result.error) {
            lines.push(`   Hata: [${result.error.code}] ${result.error.message}`)
            lines.push(`   Kategori: ${result.error.category}`)
            lines.push(`   Retry: ${result.error.isRetryable ? "Evet" : "Hayır"}`)
        }
    }

    for (const attempt of result.attempts) {
        lines.push(`   #${attempt.attempt}: ${attempt.error.code} (${attempt.delayMs}ms gecikme)`)
    }

    return lines.join("\n")
}

/**
 * GİB onay/ret durumuna göre e-fatura durumunu döndürür.
 */
export function determineInvoiceStatus(
    result: RetryResult<unknown>
): "GIB_ACCEPTED" | "GIB_REJECTED" | "GIB_WARNING" | "ERROR" {
    if (result.success) {
        // Başarılı gönderim — GİB'in yanıtına göre değişir
        // Şimdilik varsayılan olarak kabul
        return "GIB_ACCEPTED"
    }

    if (result.error?.isRetryable) {
        return "ERROR"
    }

    return "GIB_REJECTED"
}
