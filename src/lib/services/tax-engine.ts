/**
 * FAZ 3 — KDV, Tevkifat ve Stopaj Hesaplama Motoru
 * 
 * Turkish Tax Calculation Engine (Server-side only)
 * - Actual calculation functions using the Money class for precision
 * - Types, constants, and helpers are in tax-engine-types.ts for client-safe imports
 */

import { Money } from "@/lib/money"
import {
    KDV_RATES,
    TEVKIFAT_RATIOS,
    STOPAJ_RATES,
    type TaxCalculationInput,
    type TaxCalculationResult,
} from "./tax-engine-types"

// ==================== MAIN CALCULATOR ====================

export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
    const kdvRateDecimal = KDV_RATES[input.kdvRate]

    // Net / Gross conversion using Money for precision
    let net: Money
    if (input.isGross) {
        // Net = Gross / (1 + KDV rate)
        net = new Money(input.netAmount).divide(1 + kdvRateDecimal).round(2)
    } else {
        net = new Money(input.netAmount)
    }

    // KDV calculation
    const kdv = net.multiply(kdvRateDecimal).round(2)
    const gross = net.add(kdv).round(2)

    // Tevkifat (withholding on VAT)
    let tevkifat = new Money(0)
    let tevkifatNetKdv = kdv
    let tevkifatRatio: string | undefined

    if (input.tevkifatRatio) {
        const ratio = TEVKIFAT_RATIOS[input.tevkifatRatio]
        tevkifat = kdv.multiply(ratio).round(2)
        tevkifatNetKdv = kdv.subtract(tevkifat).round(2)
        tevkifatRatio = input.tevkifatRatio
    }

    // Stopaj (income tax withholding on net amount)
    let stopaj = new Money(0)
    let stopajRate: number | undefined

    if (input.stopajRate) {
        stopajRate = input.stopajRate
        stopaj = net.multiply(STOPAJ_RATES[input.stopajRate]).round(2)
    }

    // Total tax burden
    const totalTaxBurden = kdv.add(stopaj).round(2)

    // Total payable (net + effective KDV after withholding + stopaj)
    const totalPayable = net.add(tevkifatNetKdv).add(stopaj).round(2)

    return {
        netAmount: net.toNumber(),
        kdvAmount: kdv.toNumber(),
        kdvRate: input.kdvRate,
        grossAmount: gross.toNumber(),

        tevkifatBase: kdv.toNumber(),
        tevkifatRatio,
        tevkifatAmount: tevkifat.toNumber(),
        tevkifatNetKdv: tevkifatNetKdv.toNumber(),

        stopajBase: net.toNumber(),
        stopajRate,
        stopajAmount: stopaj.toNumber(),

        totalTaxBurden: totalTaxBurden.toNumber(),
        totalPayable: totalPayable.toNumber(),
    }
}

// ==================== BATCH CALCULATIONS ====================

export interface BatchTaxItem extends TaxCalculationInput {
    label: string
}

export interface BatchTaxResult {
    items: Array<TaxCalculationResult & { label: string }>
    summary: {
        totalNet: number
        totalKdv: number
        totalTevkifat: number
        totalStopaj: number
        totalPayable: number
    }
}

export function calculateBatchTax(items: BatchTaxItem[]): BatchTaxResult {
    const results = items.map((item) => ({
        ...calculateTax(item),
        label: item.label,
    }))

    const summary = results.reduce(
        (acc, r) => ({
            totalNet: acc.totalNet + r.netAmount,
            totalKdv: acc.totalKdv + r.kdvAmount,
            totalTevkifat: acc.totalTevkifat + r.tevkifatAmount,
            totalStopaj: acc.totalStopaj + r.stopajAmount,
            totalPayable: acc.totalPayable + r.totalPayable,
        }),
        { totalNet: 0, totalKdv: 0, totalTevkifat: 0, totalStopaj: 0, totalPayable: 0 }
    )

    return { items: results, summary }
}

export { 
    getTaxTypeLabel, 
    getTevkifatPercentage, 
    formatTaxSummary,
    KDV_RATES,
    TEVKIFAT_RATIOS,
    STOPAJ_RATES,
    KDV_RATE_OPTIONS,
    TEVKIFAT_OPTIONS,
    STOPAJ_OPTIONS,
} from "./tax-engine-types"

export type {
    TaxCalculationInput,
    TaxCalculationResult,
    KdvRate,
    TevkifatRatio,
    StopajRate,
} from "./tax-engine-types"
