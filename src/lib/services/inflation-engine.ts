/**
 * FAZ 3 — Enflasyon Muhasebesi Motoru
 *
 * Enflasyon düzeltmesi (TMS 30/TFRS uyumlu):
 * - Düzeltme katsayıları ile parasal olmayan kalemlerin yeniden değerlemesi
 * - Enflasyon farkı hesaplama
 * - Otomatik düzeltme kaydı oluşturma
 *
 * Türkiye'de 2021 yılı itibarıyla geçerli olan enflasyon muhasebesi
 * uygulamasına uygun hesaplamalar yapar.
 */

// ==================== TYPES ====================

export interface InflationAdjustmentInput {
    /** Düzeltilecek tutar (defter değeri) */
    bookValue: number
    /** Düzeltme katsayısı */
    coefficient: number
    /** Varlığın edinim tarihi (opsiyonel — raporlama için) */
    acquisitionDate?: Date
}

export interface InflationAdjustmentResult {
    /** Düzeltilmiş tutar */
    adjustedValue: number
    /** Enflasyon farkı (adjusted - book) */
    inflationDifference: number
    /** Uygulanan katsayı */
    appliedCoefficient: number
    /** Düzeltme oranı (%) */
    adjustmentRate: number
}

export interface RevaluationInput {
    /** Düzeltilecek kalemler */
    items: Array<{
        label: string
        accountCode: string
        bookValue: number
        coefficient: number
    }>
    /** Referans dönem */
    period: {
        year: number
        month: number
    }
}

export interface RevaluationResult {
    adjustments: Array<{
        label: string
        accountCode: string
        bookValue: number
        adjustedValue: number
        difference: number
    }>
    summary: {
        totalBookValue: number
        totalAdjustedValue: number
        totalDifference: number
    }
    /** Oluşturulan muhasebe fişi taslağı */
    journalEntry: {
        description: string
        date: Date
        lines: Array<{
            side: "DEBIT" | "CREDIT"
            accountCode: string
            amount: number
            description: string
        }>
    }
}

// ==================== ADJUSTMENT CALCULATIONS ====================

/**
 * Tek bir kalem için enflasyon düzeltmesi hesaplar.
 * Düzeltilmiş Tutar = Defter Değeri x Düzeltme Katsayısı
 * Enflasyon Farkı = Düzeltilmiş Tutar - Defter Değeri
 */
export function calculateInflationAdjustment(input: InflationAdjustmentInput): InflationAdjustmentResult {
    const adjustedValue = round(input.bookValue * input.coefficient)
    const inflationDifference = round(adjustedValue - input.bookValue)
    const adjustmentRate = round((input.coefficient - 1) * 100)

    return {
        adjustedValue,
        inflationDifference,
        appliedCoefficient: input.coefficient,
        adjustmentRate,
    }
}

/**
 * Toplu yeniden değerleme yapar ve otomatik muhasebe fişi oluşturur.
 *
 * Fiş mantığı:
 * - Borç: Düzeltilen varlık hesabı (değer artışı)
 * - Alacak: Enflasyon düzeltmesi fark hesabı (698 - Enflasyon Düzeltmesi Hesabı)
 * - Veya tersi (değer azalışı durumunda)
 */
export function calculateRevaluation(input: RevaluationInput): RevaluationResult {
    const adjustments = input.items.map((item) => {
        const result = calculateInflationAdjustment({
            bookValue: item.bookValue,
            coefficient: item.coefficient,
        })
        return {
            label: item.label,
            accountCode: item.accountCode,
            bookValue: item.bookValue,
            adjustedValue: result.adjustedValue,
            difference: result.inflationDifference,
        }
    })

    const summary = adjustments.reduce(
        (acc, adj) => ({
            totalBookValue: acc.totalBookValue + adj.bookValue,
            totalAdjustedValue: acc.totalAdjustedValue + adj.adjustedValue,
            totalDifference: acc.totalDifference + adj.difference,
        }),
        { totalBookValue: 0, totalAdjustedValue: 0, totalDifference: 0 }
    )

    // Muhasebe fişi oluştur
    const journalLines: RevaluationResult["journalEntry"]["lines"] = []

    for (const adj of adjustments) {
        if (adj.difference >= 0) {
            // Değer artışı: Borç varlık, Alacak enflasyon farkı
            journalLines.push({
                side: "DEBIT",
                accountCode: adj.accountCode,
                amount: round(Math.abs(adj.difference)),
                description: adj.label,
            })
        } else {
            // Değer azalışı: Borç enflasyon farkı, Alacak varlık
            journalLines.push({
                side: "CREDIT",
                accountCode: adj.accountCode,
                amount: round(Math.abs(adj.difference)),
                description: adj.label,
            })
        }
    }

    // Toplam fark pozitifse Alacak tarafı, negatifse Borç tarafı
    if (summary.totalDifference >= 0) {
        journalLines.push({
            side: "CREDIT",
            accountCode: "698", // Enflasyon Düzeltmesi Hesabı
            amount: round(summary.totalDifference),
            description: "Enflasyon düzeltmesi farkı (parasal kazanç)",
        })
    } else {
        journalLines.push({
            side: "DEBIT",
            accountCode: "698", // Enflasyon Düzeltmesi Hesabı
            amount: round(Math.abs(summary.totalDifference)),
            description: "Enflasyon düzeltmesi farkı (parasal kayıp)",
        })
    }

    return {
        adjustments,
        summary: {
            totalBookValue: round(summary.totalBookValue),
            totalAdjustedValue: round(summary.totalAdjustedValue),
            totalDifference: round(summary.totalDifference),
        },
        journalEntry: {
            description: `${input.period.year}/${input.period.month} Dönemi Enflasyon Düzeltmesi`,
            date: new Date(),
            lines: journalLines,
        },
    }
}

/**
 * Birden çok dönem için kümülatif düzeltme katsayısı hesaplar.
 * Kümülatif Katsayı = Π(1 + aylık_enflasyon_oranı)
 */
export function calculateCumulativeCoefficient(
    monthlyRates: number[]
): number {
    const cumulative = monthlyRates.reduce((acc, rate) => acc * (1 + rate / 100), 1)
    return round(cumulative, 8)
}

// ==================== HELEPRS ====================

function round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

/**
 * Enflasyon farkını formatlı gösterir (parantezli negatif)
 */
export function formatInflationDifference(difference: number, locale: string = "tr-TR"): string {
    const fmt = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "TRY",
    })
    if (difference >= 0) {
        return `+${fmt.format(difference)}`
    }
    return fmt.format(difference) // Negatif değer otomatik parantezli gösterilir
}
