"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    currencySchema,
    exchangeRateSchema,
    type CurrencyFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, NotFoundError, ConflictError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== DÖVİZ & KUR ====================

const round = (num: number) => Math.round(num * 100) / 100;

type CurrencyWithMapped = Prisma.CurrencyGetPayload<{}>

export async function getCurrencies(): Promise<CurrencyWithMapped[]>
export async function getCurrencies(params: PaginationParams): Promise<PaginatedResult<CurrencyWithMapped>>
export async function getCurrencies(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    if (!pagination) {
        return db.currency.findMany({ orderBy: { code: "asc" } })
    }

    const [data, total] = await Promise.all([
        db.currency.findMany({ ...pagination, orderBy: { code: "asc" } }),
        db.currency.count(),
    ])
    return createPaginatedResult(data, total, params)
}

export async function getCurrency(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.currency.findFirst({
        where: { id, tenantId: user.tenantId },
    })
}

export async function createCurrency(data: CurrencyFormValues): Promise<ActionResult<Prisma.CurrencyGetPayload<{}>>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)

        const parsed = currencySchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const currency = await db.currency.create({
            data: { ...parsed.data, tenantId: user.tenantId },
        })

        logger.info("Currency created", { module: MODULE.TR_ACCOUNTING, userId: user.id, currencyId: currency.id, code: currency.code })
        revalidatePath(PATHS.CURRENCIES)
        return currency
    })
}

export async function updateCurrency(id: string, data: CurrencyFormValues) : Promise<ActionResult<void>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = currencySchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const currency = await db.currency.updateMany({
            where: { id, tenantId: user.tenantId },
            data: parsed.data,
        })
    
        if (currency.count === 0) {
            throw new NotFoundError("Currency")
        }
    
        logger.info("Currency updated", { module: MODULE.TR_ACCOUNTING, userId: user.id, currencyId: id })
        revalidatePath(PATHS.CURRENCIES)
    
    })
}

export async function deleteCurrency(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)

        // Check if currency is in use before deleting
        const inUse = await db.currency.findFirst({
            where: { id, tenantId: user.tenantId },
            include: {
                exchangeRatesFrom: { take: 1 },
                exchangeRatesTo: { take: 1 },
            },
        })

        if (!inUse) {
            throw new NotFoundError("Currency")
        }

        if (inUse.exchangeRatesFrom.length > 0 || inUse.exchangeRatesTo.length > 0) {
            throw new ConflictError("Cannot delete currency with existing exchange rates. Remove rates first.")
        }

        const result = await db.currency.updateMany({
            where: { id, tenantId: user.tenantId },
            data: { deletedAt: new Date() },
        })

        if (result.count === 0) {
            throw new NotFoundError("Currency")
        }

        logger.info("Currency soft-deleted", { module: MODULE.TR_ACCOUNTING, userId: user.id, currencyId: id })
        revalidatePath(PATHS.CURRENCIES)
    })
}

export async function getExchangeRates(currencyId?: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const where: Prisma.CurrencyExchangeRateWhereInput = currencyId
        ? { fromCurrencyId: currencyId }
        : {}

    return db.currencyExchangeRate.findMany({
        where,
        include: { fromCurrency: true, toCurrency: true },
        orderBy: { date: "desc" },
        take: 100,
    })
}

export async function createExchangeRate(data: import("@/lib/validations/tr-accounting").ExchangeRateFormValues): Promise<ActionResult<Prisma.CurrencyExchangeRateGetPayload<{ include: { fromCurrency: true; toCurrency: true } }>>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = exchangeRateSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const rate = await db.currencyExchangeRate.create({
            data: {
                fromCurrencyId: parsed.data.fromCurrencyId,
                toCurrencyId: parsed.data.toCurrencyId,
                rate: parsed.data.rate,
                date: parsed.data.date,
                source: parsed.data.source || "MANUAL",
                tenantId: user.tenantId,
            },
            include: { fromCurrency: true, toCurrency: true },
        })
    
        logger.info("Exchange rate created", {
            module: MODULE.TR_ACCOUNTING,
            userId: user.id,
            rateId: rate.id,
            from: parsed.data.fromCurrencyId,
            to: parsed.data.toCurrencyId,
        })
        revalidatePath(PATHS.CURRENCIES)
        return rate
    })
}

export async function updateExchangeRate(id: string, data: import("@/lib/validations/tr-accounting").ExchangeRateFormValues): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = exchangeRateSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const result = await db.currencyExchangeRate.updateMany({
            where: { id, tenantId: user.tenantId },
            data: {
                rate: parsed.data.rate,
                date: parsed.data.date,
                source: parsed.data.source || "MANUAL",
            },
        })
    
        if (result.count === 0) {
            throw new NotFoundError("Exchange rate")
        }
    
        logger.info("Exchange rate updated", { module: MODULE.TR_ACCOUNTING, userId: user.id, rateId: id })
        revalidatePath(PATHS.CURRENCIES)
    })
}

export async function deleteExchangeRate(id: string) : Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        await db.currencyExchangeRate.deleteMany({
            where: { id, tenantId: user.tenantId },
        })
    
        logger.info("Exchange rate deleted", { module: MODULE.TR_ACCOUNTING, userId: user.id, rateId: id })
        revalidatePath(PATHS.CURRENCIES)
    
    })
}

/**
 * Belirtilen döviz çifti için en güncel kuru döndürür.
 */
export async function getLatestExchangeRate(fromCurrencyId: string, toCurrencyId: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const rate = await db.currencyExchangeRate.findFirst({
        where: {
            fromCurrencyId,
            toCurrencyId,
            tenantId: user.tenantId,
        },
        include: { fromCurrency: true, toCurrency: true },
        orderBy: { date: "desc" },
    })

    return rate ? { ...rate, rate: Number(rate.rate) } : null
}

/**
 * Bir tutarı kaynak dövizden hedef dövize çevirir.
 * En güncel kuru kullanır. Eğer kur bulunamazsa 1.0 varsayılır.
 */
export async function convertAmount(
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    date?: Date
): Promise<{ convertedAmount: number; rate: number; fromCurrency: string; toCurrency: string }> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    // Same currency — no conversion needed
    if (fromCurrencyId === toCurrencyId) {
        const currency = await db.currency.findUnique({ where: { id: fromCurrencyId } })
        return {
            convertedAmount: amount,
            rate: 1,
            fromCurrency: currency?.code || "?",
            toCurrency: currency?.code || "?",
        }
    }

    // Find the most recent rate
    const dateFilter: Prisma.CurrencyExchangeRateWhereInput = date
        ? { date: { lte: date } }
        : {}

    const rate = await db.currencyExchangeRate.findFirst({
        where: {
            fromCurrencyId,
            toCurrencyId,
            tenantId: user.tenantId,
            ...dateFilter,
        },
        include: { fromCurrency: true, toCurrency: true },
        orderBy: { date: "desc" },
    })

    if (rate) {
        const actualRate = Number(rate.rate)
        return {
            convertedAmount: round(amount * actualRate),
            rate: actualRate,
            fromCurrency: rate.fromCurrency.code,
            toCurrency: rate.toCurrency.code,
        }
    }

    // Try reverse rate (1 / reverse)
    const reverseRate = await db.currencyExchangeRate.findFirst({
        where: {
            fromCurrencyId: toCurrencyId,
            toCurrencyId: fromCurrencyId,
            tenantId: user.tenantId,
            ...dateFilter,
        },
        include: { fromCurrency: true, toCurrency: true },
        orderBy: { date: "desc" },
    })

    if (reverseRate) {
        const actualRate = 1 / Number(reverseRate.rate)
        return {
            convertedAmount: round(amount * actualRate),
            rate: actualRate,
            fromCurrency: reverseRate.toCurrency.code,
            toCurrency: reverseRate.fromCurrency.code,
        }
    }

    // No rate found — log warning and return 1.0 fallback
    const [fromCur, toCur] = await Promise.all([
        db.currency.findUnique({ where: { id: fromCurrencyId }, select: { code: true } }),
        db.currency.findUnique({ where: { id: toCurrencyId }, select: { code: true } }),
    ])

    logger.warn("Exchange rate not found, using 1.0 fallback", {
        module: MODULE.TR_ACCOUNTING,
        userId: user.id,
        fromCurrency: fromCur?.code,
        toCurrency: toCur?.code,
        date: date?.toISOString(),
    })

    return {
        convertedAmount: amount,
        rate: 1,
        fromCurrency: fromCur?.code || "?",
        toCurrency: toCur?.code || "?",
    }
}

