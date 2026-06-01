/**
 * Deftra — TCMB (Türkiye Cumhuriyet Merkez Bankası) Exchange Rate Service
 *
 * Fetches daily exchange rates from TCMB's public XML API.
 * Supports: USD, EUR, GBP, CHF, JPY, SAR, RUB and other major currencies.
 *
 * TCMB API Endpoint: https://www.tcmb.gov.tr/kurlar/today.xml
 * Returns XML with currency codes, names, buying/selling rates.
 *
 * Usage:
 *   const rates = await fetchTcmbRates()
 *   // rates = [{ code: "USD", name: "ABD DOLARI", buyingRate: 30.50, sellingRate: 30.65 }, ...]
 *
 *   await syncTcmbRatesToDb(user.tenantId, prismaClient)
 *   // Automatically creates/updates CurrencyExchangeRate records
 */

import logger from "@/lib/logger"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TcmbCurrencyRate {
    code: string           // ISO 4217 currency code (USD, EUR, etc.)
    name: string           // Turkish name (ABD DOLARI, EURO, etc.)
    unit: number           // Currency unit (1 for most, 100 for JPY)
    buyingRate: number     // Alış kuru
    sellingRate: number    // Satış kuru
    effectiveBuying: number // Efektif alış
    effectiveSelling: number // Efektif satış
}

export interface TcmbResponse {
    date: string           // TCMB tarihi (YYYY-MM-DD)
    rates: TcmbCurrencyRate[]
}

// ─── Configuration ─────────────────────────────────────────────────────────

const TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"
const TCMB_DATE_URL = (year: number, month: number, day: number) =>
    `https://www.tcmb.gov.tr/kurlar/${year}${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}${String(month).padStart(2, "0")}${year}.xml`

const FETCH_TIMEOUT_MS = 10_000
const SUPPORTED_CURRENCIES = new Set([
    "USD", "EUR", "GBP", "CHF", "JPY", "SAR", "RUB",
    "DKK", "SEK", "NOK", "AUD", "CAD", "KWD", "CNY",
    "BGN", "RON", "PLN", "XAU", "XDR",
])

// ─── XML Parser ────────────────────────────────────────────────────────────

/**
 * Parses TCMB XML response into structured data.
 * TCMB XML format:
 *   <Tarih_Date Date="01/15/2024">
 *     <Currency CurrencyCode="USD">
 *       <Unit>1</Unit>
 *       <Isim>ABD DOLARI</Isim>
 *       <ForexBuying>30.50</ForexBuying>
 *       <ForexSelling>30.65</ForexSelling>
 *       <BanknoteBuying>30.40</BanknoteBuying>
 *       <BanknoteSelling>30.75</BanknoteSelling>
 *     </Currency>
 *   </Tarih_Date>
 */
function parseTcmbXml(xmlText: string): TcmbResponse {
    const dateMatch = xmlText.match(/Date="(\d{2})\.(\d{2})\.(\d{4})"/)
    const dateStr = dateMatch
        ? `${dateMatch[3]!}-${dateMatch[2]!}-${dateMatch[1]!}`
        : new Date().toISOString().slice(0, 10)

    const rates: TcmbCurrencyRate[] = []

    // Parse each Currency element using regex (lightweight, no DOM parser needed)
    const currencyRegex = /<Currency\s+CurrencyCode="([^"]+)"[^>]*>([\s\S]*?)<\/Currency>/g
    let match: RegExpExecArray | null

    while ((match = currencyRegex.exec(xmlText)) !== null) {
        const code = match[1]!
        const content = match[2]!

        // Only parse supported currencies + TRY is implicit (base)
        if (!SUPPORTED_CURRENCIES.has(code) && code !== "XDR") continue

        const extract = (tag: string): number => {
            const tagMatch = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
            if (!tagMatch) return 0
            const val = tagMatch[1]!.replace(",", ".")
            return parseFloat(val) || 0
        }

        const unit = extract("Unit") || 1

        rates.push({
            code,
            name: extractName(content),
            unit,
            buyingRate: extract("ForexBuying") / unit,
            sellingRate: extract("ForexSelling") / unit,
            effectiveBuying: extract("BanknoteBuying") / unit,
            effectiveSelling: extract("BanknoteSelling") / unit,
        })
    }

    return { date: dateStr, rates }
}

/**
 * Extracts the Turkish name from a Currency XML block.
 * Handles CDATA sections.
 */
function extractName(content: string): string {
    const cdataMatch = content.match(/<Isim><!\[CDATA\[([^\]]+)\]\]><\/Isim>/)
    if (cdataMatch) return cdataMatch[1]!.trim()
    const plainMatch = content.match(/<Isim>([^<]*)<\/Isim>/)
    return plainMatch ? plainMatch[1]!.trim() : ""
}

// ─── HTTP Client ───────────────────────────────────────────────────────────

/**
 * Fetches raw XML from TCMB API.
 * Uses fetch with timeout; falls back to date-specific URL if today's rates
 * are not yet published (before 15:30 TR time on weekdays).
 */
async function fetchTcmbXml(): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
        const response = await fetch(TCMB_TODAY_URL, {
            signal: controller.signal,
            headers: { Accept: "application/xml, text/xml" },
        })

        if (!response.ok) {
            throw new Error(`TCMB API returned ${response.status}`)
        }

        return await response.text()
    } catch (err) {
        // If today's rates are not published yet, try yesterday
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const fallbackUrl = TCMB_DATE_URL(
            yesterday.getFullYear(),
            yesterday.getMonth() + 1,
            yesterday.getDate()
        )

        logger.warn("TCMB today.xml fetch failed, trying fallback URL", {
            module: "tcmb-exchange-rate",
            error: err instanceof Error ? err : new Error("Unknown error"),
            fallbackUrl,
        })

        const fallbackResponse = await fetch(fallbackUrl, {
            signal: controller.signal,
            headers: { Accept: "application/xml, text/xml" },
        })

        if (!fallbackResponse.ok) {
            throw new Error(`TCMB fallback API returned ${fallbackResponse.status}`)
        }

        return await fallbackResponse.text()
    } finally {
        clearTimeout(timeoutId)
    }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Fetches current exchange rates from TCMB.
 *
 * @returns Parsed TCMB response with all supported currency rates
 * @throws Error if TCMB API is unreachable
 */
export async function fetchTcmbRates(): Promise<TcmbResponse> {
    const xml = await fetchTcmbXml()
    const parsed = parseTcmbXml(xml)

    if (parsed.rates.length === 0) {
        throw new Error("No currency rates found in TCMB response")
    }

    logger.info("TCMB rates fetched successfully", {
        module: "tcmb-exchange-rate",
        date: parsed.date,
        currencyCount: parsed.rates.length,
        currencies: parsed.rates.map((r) => r.code).join(", "),
    })

    return parsed
}

/**
 * Syncs TCMB exchange rates to the database.
 * Creates Currency records if they don't exist, and creates ExchangeRate records
 * for each currency pair (from TCMB currency to TRY and TRY to TCMB currency).
 *
 * @param tenantId - The tenant ID
 * @param db - A tenant-scoped Prisma client
 * @param date - Optional date for historical rate sync (defaults to today)
 */
export async function syncTcmbRatesToDb(
    tenantId: string,
    db: ReturnType<typeof import("@/lib/prisma")["getTenantPrisma"]>,
    date?: Date
): Promise<{ ratesCreated: number; currenciesCreated: number }> {
    const tcmbData = await fetchTcmbRates()
    const rateDate = date || new Date(tcmbData.date)

    let currenciesCreated = 0
    let ratesCreated = 0

    // Ensure TRY base currency exists
    const tryCurrency = await db.currency.upsert({
        where: { code_tenantId: { code: "TRY", tenantId } },
        update: { isDefault: true, isActive: true },
        create: {
            code: "TRY",
            name: "Türk Lirası",
            symbol: "₺",
            isDefault: true,
            tenantId,
        },
    })

    currenciesCreated++

    // Process each TCMB rate
    for (const tcmbRate of tcmbData.rates) {
        if (tcmbRate.buyingRate <= 0) continue

        // Upsert the foreign currency
        const currency = await db.currency.upsert({
            where: { code_tenantId: { code: tcmbRate.code, tenantId } },
            update: { isActive: true },
            create: {
                code: tcmbRate.code,
                name: getCurrencyName(tcmbRate.code, tcmbRate.name),
                symbol: getCurrencySymbol(tcmbRate.code),
                tenantId,
            },
        })

        if (currency.createdAt.getTime() === currency.updatedAt.getTime()) {
            currenciesCreated++
        }

        // Create exchange rate: Foreign → TRY
        const existingRate = await db.currencyExchangeRate.findFirst({
            where: {
                fromCurrencyId: currency.id,
                toCurrencyId: tryCurrency.id,
                tenantId,
                date: rateDate,
            },
        })

        if (!existingRate) {
            await db.currencyExchangeRate.create({
                data: {
                    fromCurrencyId: currency.id,
                    toCurrencyId: tryCurrency.id,
                    rate: tcmbRate.buyingRate,
                    date: rateDate,
                    source: "TCMB",
                    tenantId,
                },
            })
            ratesCreated++
        }

        // Create exchange rate: TRY → Foreign (1 / buyingRate)
        const reverseExisting = await db.currencyExchangeRate.findFirst({
            where: {
                fromCurrencyId: tryCurrency.id,
                toCurrencyId: currency.id,
                tenantId,
                date: rateDate,
            },
        })

        if (!reverseExisting && tcmbRate.buyingRate > 0) {
            await db.currencyExchangeRate.create({
                data: {
                    fromCurrencyId: tryCurrency.id,
                    toCurrencyId: currency.id,
                    rate: 1 / tcmbRate.buyingRate,
                    date: rateDate,
                    source: "TCMB",
                    tenantId,
                },
            })
            ratesCreated++
        }
    }

    logger.info("TCMB rates synced to database", {
        module: "tcmb-exchange-rate",
        tenantId,
        date: rateDate.toISOString(),
        currenciesCreated,
        ratesCreated,
    })

    return { ratesCreated, currenciesCreated }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Maps ISO currency codes to Turkish names (fallback for missing TCMB data).
 */
function getCurrencyName(code: string, tcmbName: string): string {
    if (tcmbName) return tcmbName
    const names: Record<string, string> = {
        USD: "ABD DOLARI",
        EUR: "EURO",
        GBP: "İNGİLİZ STERLİNİ",
        CHF: "İSVİÇRE FRANGI",
        JPY: "JAPON YENİ",
        SAR: "SUUDİ ARABİSTAN RİYALİ",
        RUB: "RUS RUBLESİ",
        DKK: "DANİMARKA KRONU",
        SEK: "İSVEÇ KRONU",
        NOK: "NORVEÇ KRONU",
        AUD: "AVUSTRALYA DOLARI",
        CAD: "KANADA DOLARI",
        KWD: "KUVEYT DİNARI",
        CNY: "ÇİN YUANI",
        TRY: "TÜRK LİRASI",
    }
    return names[code] || code
}

/**
 * Maps ISO currency codes to their symbols.
 */
function getCurrencySymbol(code: string): string {
    const symbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        CHF: "CHF",
        JPY: "¥",
        SAR: "﷼",
        RUB: "₽",
        DKK: "kr",
        SEK: "kr",
        NOK: "kr",
        AUD: "A$",
        CAD: "C$",
        KWD: "د.ك",
        CNY: "¥",
        TRY: "₺",
    }
    return symbols[code] || code
}

/**
 * Server action: Sync TCMB rates for a tenant.
 * Called from the UI or via a cron job.
 */
export async function syncTcmbRatesAction(): Promise<{
    success: boolean
    ratesCreated: number
    currenciesCreated: number
    error?: string
}> {
    try {
        const { requireAuth } = await import("@/lib/auth-utils")
        const { getTenantPrisma } = await import("@/lib/prisma")

        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const result = await syncTcmbRatesToDb(user.tenantId, db as ReturnType<typeof import("@/lib/prisma").getTenantPrisma>)

        return {
            success: true,
            ...result,
        }
    } catch (error) {
        logger.error("TCMB sync action failed", {
            module: "tcmb-exchange-rate",
            error: error instanceof Error ? error : new Error("Unknown error"),
        })
        const errMsg = error instanceof Error ? error.message : "Unknown error"
        return {
            success: false,
            ratesCreated: 0,
            currenciesCreated: 0,
            error: errMsg,
        }
    }
}
