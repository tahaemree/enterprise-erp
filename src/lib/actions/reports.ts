"use server"

import { unstable_cache } from "next/cache"

import type { PrismaClient } from "@prisma/client"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import {
    getIncomeStatement,
    getBalanceSheet,
    getPivotData,
    getPeriodComparison,
    getDashboardKpis,
} from "@/lib/services/reporting-engine"
import type { DateRange, PivotConfig } from "@/lib/services/reporting-engine"
import { serializePrisma } from "@/lib/utils"
import { CACHE_TAGS } from "@/lib/constants"

export async function getIncomeStatementData(
    startDate: Date,
    endDate: Date,
    compareWithPrevious?: boolean,
) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId) as unknown as PrismaClient

    const period: DateRange = { start: startDate, end: endDate }

    if (compareWithPrevious) {
        const duration = endDate.getTime() - startDate.getTime()
        const prevEnd = new Date(startDate.getTime() - 1)
        const prevStart = new Date(prevEnd.getTime() - duration)

        const data = await getIncomeStatement(db, user.tenantId, period, {
            start: prevStart,
            end: prevEnd,
        })
        return serializePrisma(data)
    }

    const data = await getIncomeStatement(db, user.tenantId, period)
    return serializePrisma(data)
}

export async function getBalanceSheetData(asOfDate: Date) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId) as unknown as PrismaClient
    const data = await getBalanceSheet(db, user.tenantId, asOfDate)
    return serializePrisma(data)
}

export async function getPivotAnalysisData(config: PivotConfig) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId) as unknown as PrismaClient
    const data = await getPivotData(db, user.tenantId, config)
    return serializePrisma(data)
}

export async function getPeriodComparisonData(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId) as unknown as PrismaClient
    const data = await getPeriodComparison(
        db,
        user.tenantId,
        { start: currentStart, end: currentEnd },
        { start: previousStart, end: previousEnd },
    )
    return serializePrisma(data)
}

const getCachedDashboardKpis = unstable_cache(
    async (tenantId: string) => {
        const db = getTenantPrisma(tenantId) as unknown as PrismaClient
        return getDashboardKpis(db, tenantId)
    },
    [CACHE_TAGS.KPIS],
    { revalidate: 300, tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.KPIS] }
)

export async function getDashboardKpisData() {
    const user = await requireAuth()
    const data = await getCachedDashboardKpis(user.tenantId)
    return serializePrisma(data)
}
