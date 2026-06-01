/**
 * Tax Engine Types & Constants — Client-safe exports
 * 
 * Pure types, constants, and helper functions that don't depend on
 * Prisma/Money class. Safe to import in client components.
 */

// ==================== TYPES ====================

export type KdvRate = 1 | 8 | 18
export type TevkifatRatio = "2/10" | "3/10" | "4/10" | "5/10" | "7/10" | "9/10"
export type StopajRate = 10 | 15 | 20 | 25

export interface TaxCalculationInput {
    /** Net tutar (KDV hariç) */
    netAmount: number
    /** KDV oranı (%) */
    kdvRate: KdvRate
    /** İsteğe bağlı tevkifat oranı */
    tevkifatRatio?: TevkifatRatio
    /** İsteğe bağlı stopaj oranı (%) */
    stopajRate?: StopajRate
    /** KDV dahil mi? (default: false = KDV hariç tutar) */
    isGross?: boolean
}

export interface TaxCalculationResult {
    /** Net tutar (KDV matrahı) */
    netAmount: number
    /** KDV tutarı */
    kdvAmount: number
    /** KDV oranı (%) */
    kdvRate: KdvRate
    /** Toplam KDV dahil tutar (net + kdv) */
    grossAmount: number

    // Tevkifat
    /** Tevkifat matrahı (genellikle KDV tutarı) */
    tevkifatBase: number
    /** Tevkifat oranı (kesir) */
    tevkifatRatio?: string
    /** Tevkifat tutarı */
    tevkifatAmount: number
    /** Tevkifat sonrası ödenecek KDV (KDV - tevkifat) */
    tevkifatNetKdv: number

    // Stopaj
    /** Stopaj matrahı (net tutar) */
    stopajBase: number
    /** Stopaj oranı (%) */
    stopajRate?: number
    /** Stopaj tutarı */
    stopajAmount: number

    // Özet
    /** Toplam vergi yükü (KDV + varsa tevkifat/stopaj) */
    totalTaxBurden: number
    /** Ödenecek toplam (net + kdv - tevkifat.net + stopaj) */
    totalPayable: number
}

// ==================== KDV RATES ====================

export const KDV_RATES: Record<KdvRate, number> = {
    1: 0.01,
    8: 0.08,
    18: 0.18,
}

export const KDV_RATE_OPTIONS = [
    { value: 18 as KdvRate, label: "KDV1 (%18)", description: "Genel oran — çoğu mal ve hizmet" },
    { value: 8 as KdvRate, label: "KDV2 (%8)", description: "İndirimli oran — gıda, sağlık, eğitim" },
    { value: 1 as KdvRate, label: "KDV3 (%1)", description: "İndirimli oran — temel gıda, konut" },
] as const

// ==================== TEVKİFAT RATIOS ====================

export const TEVKIFAT_RATIOS: Record<TevkifatRatio, number> = {
    "2/10": 0.20,
    "3/10": 0.30,
    "4/10": 0.40,
    "5/10": 0.50,
    "7/10": 0.70,
    "9/10": 0.90,
}

export const TEVKIFAT_OPTIONS = [
    { value: "2/10" as TevkifatRatio, label: "2/10 (%20)", description: "Yeminli mali müşavir / noter" },
    { value: "3/10" as TevkifatRatio, label: "3/10 (%30)", description: "Et ve süt ürünleri" },
    { value: "4/10" as TevkifatRatio, label: "4/10 (%40)", description: "Hurda, bakır, çinko alımları" },
    { value: "5/10" as TevkifatRatio, label: "5/10 (%50)", description: "Tekstil, konfeksiyon, deri" },
    { value: "7/10" as TevkifatRatio, label: "7/10 (%70)", description: "Reklam, basım, temizlik" },
    { value: "9/10" as TevkifatRatio, label: "9/10 (%90)", description: "Yapım işleri, danışmanlık, yazılım" },
] as const

// ==================== STOPAJ RATES ====================

export const STOPAJ_RATES: Record<StopajRate, number> = {
    10: 0.10,
    15: 0.15,
    20: 0.20,
    25: 0.25,
}

export const STOPAJ_OPTIONS = [
    { value: 10 as StopajRate, label: "%10", description: "Kira stopajı (konut)" },
    { value: 15 as StopajRate, label: "%15", description: "Serbest meslek kazancı" },
    { value: 20 as StopajRate, label: "%20", description: "Kira stopajı (iş yeri)" },
    { value: 25 as StopajRate, label: "%25", description: "Telif, patent, know-how" },
] as const

// ==================== HELPERS ====================

/**
 * Vergi türü adını döndürür
 */
export function getTaxTypeLabel(rate: KdvRate): string {
    switch (rate) {
        case 1: return "KDV3 (%1)"
        case 8: return "KDV2 (%8)"
        case 18: return "KDV1 (%18)"
    }
}

/**
 * Tevkifat oranını yüzde olarak döndürür
 */
export function getTevkifatPercentage(ratio: TevkifatRatio): string {
    const percentages: Record<TevkifatRatio, string> = {
        "2/10": "%20",
        "3/10": "%30",
        "4/10": "%40",
        "5/10": "%50",
        "7/10": "%70",
        "9/10": "%90",
    }
    return percentages[ratio]
}

/**
 * Vergi hesaplama özetini string olarak döndürür
 */
export function formatTaxSummary(result: TaxCalculationResult, locale: string = "tr-TR"): string {
    const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "TRY" }).format(n)
    const lines: string[] = [
        `Net Tutar: ${fmt(result.netAmount)}`,
        `KDV (${result.kdvRate}%): ${fmt(result.kdvAmount)}`,
        `Brüt Tutar: ${fmt(result.grossAmount)}`,
    ]

    if (result.tevkifatAmount > 0) {
        lines.push(`Tevkifat (${result.tevkifatRatio}): -${fmt(result.tevkifatAmount)}`)
        lines.push(`Ödenecek KDV: ${fmt(result.tevkifatNetKdv)}`)
    }

    if (result.stopajAmount > 0) {
        lines.push(`Stopaj (%${result.stopajRate}): ${fmt(result.stopajAmount)}`)
    }

    lines.push(`Toplam Ödenecek: ${fmt(result.totalPayable)}`)
    return lines.join("\n")
}
