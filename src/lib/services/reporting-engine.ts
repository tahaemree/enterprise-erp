/**
 * Deftra — Reporting Engine
 * 
 * Server-side computation engine for:
 *   - Income Statement (Gelir Tablosu)
 *   - Balance Sheet (Bilanço)
 *   - Pivot Analysis
 *   - Period Comparison
 *   - KPI Calculations
 */

import type { PrismaClient } from "@prisma/client"

// ── Shared Types ──────────────────────────────────────────────────────────

export interface DateRange {
    start: Date
    end: Date
}

export type PeriodGranularity = "daily" | "monthly" | "quarterly" | "yearly"

// ── Income Statement Types ────────────────────────────────────────────────

export interface IncomeStatementLine {
    label: string
    amount: number
    isTotal?: boolean
    children?: IncomeStatementLine[]
}

export interface IncomeStatement {
    period: DateRange
    revenue: IncomeStatementLine[]
    expenses: IncomeStatementLine[]
    grossProfit: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    expenseRatio: number
    previousPeriod?: {
        totalRevenue: number
        totalExpenses: number
        netProfit: number
        revenueChangePercent: number
        expenseChangePercent: number
        profitChangePercent: number
    }
}

// ── Balance Sheet Types ───────────────────────────────────────────────────

export interface BalanceSheetLine {
    label: string
    amount: number
    isTotal?: boolean
    children?: BalanceSheetLine[]
}

export interface BalanceSheet {
    asOfDate: Date
    assets: BalanceSheetLine[]
    liabilities: BalanceSheetLine[]
    equity: BalanceSheetLine[]
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    // Accounting equation: Assets = Liabilities + Equity
    balanceCheck: {
        passed: boolean
        difference: number
    }
}

// ── Pivot Analysis Types ──────────────────────────────────────────────────

export type PivotAggregation = "sum" | "count" | "avg" | "min" | "max"

export interface PivotField {
    field: string
    label: string
}

export interface PivotConfig {
    rows: PivotField[]
    columns: PivotField[]
    values: Array<{
        field: string
        label: string
        aggregation: PivotAggregation
    }>
    filters?: Record<string, string | string[]>
    dateRange?: DateRange
    granularity?: PeriodGranularity
}

export interface PivotCell {
    value: number
    formatted: string
    count?: number
}

export interface PivotResult {
    config: PivotConfig
    columnHeaders: string[]
    rowHeaders: string[]
    data: Record<string, Record<string, PivotCell>>
    totals: Record<string, PivotCell>
    grandTotal: PivotCell
}

// ── Period Comparison Types ───────────────────────────────────────────────

export interface PeriodMetric {
    label: string
    current: number
    previous: number
    change: number
    changePercent: number
    direction: "up" | "down" | "flat"
}

export interface PeriodComparisonResult {
    currentPeriod: DateRange
    previousPeriod: DateRange
    metrics: PeriodMetric[]
    revenue: PeriodMetric
    expenses: PeriodMetric
    profit: PeriodMetric
    orderCount: PeriodMetric
    averageOrderValue: PeriodMetric
}

// ── KPI Types ─────────────────────────────────────────────────────────────

export interface KpiResult {
    revenue: number
    revenueChange: number
    expenses: number
    expensesChange: number
    profit: number
    profitChange: number
    profitMargin: number
    profitMarginChange: number
    expenseRatio: number
    orderCount: number
    orderCountChange: number
    averageOrderValue: number
    averageOrderValueChange: number
    customerCount: number
    customerCountChange: number
    revenuePerCustomer: number
    revenuePerCustomerChange: number
}

// ── PRISMA RAW DATA TYPES ─────────────────────────────────────────────────

interface TransactionRow {
    type: string
    category: string | null
    amount: number
    date: Date
}

// ── INCOME STATEMENT ──────────────────────────────────────────────────────

const INCOME_CATEGORY_GROUPS: Record<string, string[]> = {
    "Sales Revenue": ["SALES", "SERVICE"],
    "Other Income": ["INVESTMENT", "INTEREST", "OTHER_INCOME"],
}

const EXPENSE_CATEGORY_GROUPS: Record<string, string[]> = {
    "Cost of Goods Sold": ["PURCHASE"],
    "Operating Expenses": ["SALARY", "RENT", "UTILITIES", "OFFICE", "MAINTENANCE"],
    "Sales & Marketing": ["MARKETING", "TRAVEL"],
    "Tax & Insurance": ["TAX", "INSURANCE"],
    "Other Expenses": ["OTHER_EXPENSE"],
}

function groupLines(
    items: TransactionRow[],
    groups: Record<string, string[]>,
): IncomeStatementLine[] {
    const grouped: IncomeStatementLine[] = []
    const uncategorized: IncomeStatementLine = { label: "Uncategorized", amount: 0, children: [] }

    for (const [groupLabel, categories] of Object.entries(groups)) {
        const children: IncomeStatementLine[] = []
        let groupTotal = 0

        for (const cat of categories) {
            const amount = items
                .filter((t) => t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0)
            if (amount !== 0) {
                children.push({ label: cat, amount })
                groupTotal += amount
            }
        }

        if (children.length > 0) {
            grouped.push({ label: groupLabel, amount: groupTotal, children })
        }
    }

    // Uncategorized items
    const knownCategories = Object.values(groups).flat()
    for (const item of items) {
        if (item.category && !knownCategories.includes(item.category)) {
            uncategorized.amount += item.amount
        }
    }
    if (uncategorized.amount > 0) {
        uncategorized.children?.push({
            label: "Other",
            amount: uncategorized.amount,
        })
        grouped.push(uncategorized)
    }

    if (grouped.length === 0) {
        grouped.push({ label: "No items", amount: 0 })
    }

    return grouped
}

export async function getIncomeStatement(
    db: PrismaClient,
    tenantId: string,
    period: DateRange,
    previousPeriod?: DateRange,
): Promise<IncomeStatement> {
    const [incomeRows, expenseRows] = await Promise.all([
        db.$queryRaw<TransactionRow[]>`
            SELECT type, category, CAST(amount AS DOUBLE PRECISION) as amount, date
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'INCOME'
            AND date >= ${period.start}::timestamptz
            AND date <= ${period.end}::timestamptz
        `,
        db.$queryRaw<TransactionRow[]>`
            SELECT type, category, CAST(amount AS DOUBLE PRECISION) as amount, date
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'EXPENSE'
            AND date >= ${period.start}::timestamptz
            AND date <= ${period.end}::timestamptz
        `,
    ])

    const totalRevenue = incomeRows.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0

    const result: IncomeStatement = {
        period,
        revenue: groupLines(incomeRows, INCOME_CATEGORY_GROUPS),
        expenses: groupLines(expenseRows, EXPENSE_CATEGORY_GROUPS),
        grossProfit: totalRevenue - totalExpenses,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        expenseRatio,
    }

    // Previous period comparison
    if (previousPeriod) {
        const [prevIncomeRows, prevExpenseRows] = await Promise.all([
            db.$queryRaw<TransactionRow[]>`
                SELECT type, category, CAST(amount AS DOUBLE PRECISION) as amount, date
                FROM "Transaction"
                WHERE "tenantId" = ${tenantId}
                AND type = 'INCOME'
                AND date >= ${previousPeriod.start}::timestamptz
                AND date <= ${previousPeriod.end}::timestamptz
            `,
            db.$queryRaw<TransactionRow[]>`
                SELECT type, category, CAST(amount AS DOUBLE PRECISION) as amount, date
                FROM "Transaction"
                WHERE "tenantId" = ${tenantId}
                AND type = 'EXPENSE'
                AND date >= ${previousPeriod.start}::timestamptz
                AND date <= ${previousPeriod.end}::timestamptz
            `,
        ])

        const prevRevenue = prevIncomeRows.reduce((s, r) => s + r.amount, 0)
        const prevExpenses = prevExpenseRows.reduce((s, r) => s + r.amount, 0)
        const prevProfit = prevRevenue - prevExpenses

        result.previousPeriod = {
            totalRevenue: prevRevenue,
            totalExpenses: prevExpenses,
            netProfit: prevProfit,
            revenueChangePercent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
            expenseChangePercent: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
            profitChangePercent: prevProfit !== 0 ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0,
        }
    }

    return result
}

// ── BALANCE SHEET ─────────────────────────────────────────────────────────

export async function getBalanceSheet(
    db: PrismaClient,
    tenantId: string,
    asOfDate: Date,
): Promise<BalanceSheet> {
    // Simplified balance sheet based on available data models.
    // In a full ERP this would use the chart of accounts.
    const [
        customerAccounts,
        supplierAccounts,
        bankAccounts,
        currentPeriodIncome,
        currentPeriodExpenses,
    ] = await Promise.all([
        // Receivables from customers
        // Receivables from customers
        db.$queryRaw<Array<{ balance: number; count: number }>>`
            SELECT COALESCE(CAST(SUM("currentBalance") AS DOUBLE PRECISION), 0) as balance,
                   COUNT(*) as count
            FROM "CustomerAccount"
            WHERE "tenantId" = ${tenantId}
        `,
        // Payables to suppliers
        db.$queryRaw<Array<{ balance: number; count: number }>>`
            SELECT COALESCE(CAST(SUM("currentBalance") AS DOUBLE PRECISION), 0) as balance,
                   COUNT(*) as count
            FROM "SupplierAccount"
            WHERE "tenantId" = ${tenantId}
        `,
        // Bank/cash balances
        db.$queryRaw<Array<{ balance: number; count: number }>>`
            SELECT COALESCE(CAST(SUM(balance) AS DOUBLE PRECISION), 0) as balance,
                   COUNT(*) as count
            FROM "BankAccount"
            WHERE "tenantId" = ${tenantId}
            AND "isActive" = true
        `,
        // Current period income for retained earnings
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'INCOME'
            AND date <= ${asOfDate}::timestamptz
        `,
        // Current period expenses for retained earnings
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'EXPENSE'
            AND date <= ${asOfDate}::timestamptz
        `,
    ])

    const totalReceivables = Number(customerAccounts[0]?.balance ?? 0)
    const totalPayables = Number(supplierAccounts[0]?.balance ?? 0)
    const totalCash = Number(bankAccounts[0]?.balance ?? 0)
    const totalIncome = Number(currentPeriodIncome[0]?.total ?? 0)
    const totalExpensesCurrent = Number(currentPeriodExpenses[0]?.total ?? 0)
    const retainedEarnings = totalIncome - totalExpensesCurrent

    // Build asset lines
    const assets: BalanceSheetLine[] = [
        {
            label: "Current Assets",
            amount: totalCash + totalReceivables,
            children: [
                { label: "Cash & Bank", amount: totalCash },
                { label: "Accounts Receivable", amount: totalReceivables },
            ],
        },
    ]
    const totalAssets = totalCash + totalReceivables

    // Build liability lines
    const liabilities: BalanceSheetLine[] = [
        {
            label: "Current Liabilities",
            amount: totalPayables,
            children: [
                { label: "Accounts Payable", amount: totalPayables },
            ],
        },
    ]
    const totalLiabilities = totalPayables

    // Build equity lines
    const equity: BalanceSheetLine[] = [
        {
            label: "Equity",
            amount: retainedEarnings,
            children: [
                { label: "Current Period Profit/Loss", amount: retainedEarnings },
            ],
        },
    ]
    const totalEquity = retainedEarnings
    const balanceDiff = Math.abs(totalAssets - (totalLiabilities + totalEquity))

    return {
        asOfDate,
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        balanceCheck: {
            passed: balanceDiff < 0.01,
            difference: balanceDiff,
        },
    }
}

// ── PIVOT ANALYSIS ────────────────────────────────────────────────────────

export async function getPivotData(
    db: PrismaClient,
    tenantId: string,
    config: PivotConfig,
): Promise<PivotResult> {
    const { rows, columns, values, dateRange } = config
    const isCurrency = values[0]?.aggregation !== "count"

    // Fetch transactions as the base data source
    const dateFilter = dateRange
        ? `AND t.date >= $1::timestamptz AND t.date <= $2::timestamptz`
        : ""
    const params: unknown[] = [tenantId]
    if (dateRange) {
        params.push(dateRange.start, dateRange.end)
    }

    const rawData = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
        SELECT
            t.type,
            t.category,
            CAST(t.amount AS DOUBLE PRECISION) as amount,
            t.date,
            t.status,
            o.status as order_status,
            o.total as order_total,
            c."firstName" as customer_first_name,
            c."lastName" as customer_last_name,
            c.company as customer_company,
            c.city as customer_city,
            c.status as customer_status
        FROM "Transaction" t
        LEFT JOIN "Order" o ON o.id = t."orderId"
        LEFT JOIN "Customer" c ON c.id = o."customerId"
        WHERE t."tenantId" = $1
        ${dateFilter}
        ORDER BY t.date ASC
        `,
        ...params,
    )

    // Build column headers based on column fields
    const columnValues = getDistinctValues(rawData as Array<Record<string, string>>, columns)

    // Build row headers based on row fields
    const rowValues = getDistinctValues(rawData as Array<Record<string, string>>, rows)

    // Aggregate data
    const data: Record<string, Record<string, PivotCell>> = {}
    const columnTotals: Record<string, PivotCell> = {}
    let grandTotal = 0
    let grandCount = 0

    for (const rowVal of rowValues) {
        const rowKey = rowVal
        data[rowKey] = {}
        let rowTotal = 0
        let rowCount = 0

        for (const colVal of columnValues) {
            const colKey = colVal
            const matchingItems = (rawData as Array<Record<string, unknown>>).filter((item) => {
                const rowMatch = rows.every((rf) => {
                    const fieldValue = getFieldValue(item, rf.field)
                    return fieldValue === rowVal || (rowVal === "(empty)" && !fieldValue)
                })
                const colMatch = columns.every((cf) => {
                    const fieldValue = getFieldValue(item, cf.field)
                    return fieldValue === colVal || (colVal === "(empty)" && !fieldValue)
                })
                return rowMatch && colMatch
            })

            const cell = computeAggregation(matchingItems, values)
            data[rowKey][colKey] = cell
            rowTotal += cell.value
            rowCount += cell.count ?? 0
        }

        // Row totals
        if (values.length === 1) {
            data[rowKey]["Total"] = {
                value: rowTotal,
                formatted: formatPivotValue(rowTotal, isCurrency),
                count: rowCount,
            }
        }

        grandTotal += rowTotal
        grandCount += rowCount
    }

    // Column totals
    for (const colVal of columnValues) {
        let colTotal = 0
        let colCount = 0
        for (const rowVal of rowValues) {
            const cell = data[rowVal]?.[colVal]
            if (cell) {
                colTotal += cell.value
                colCount += cell.count ?? 0
            }
        }
        columnTotals[colVal] = {
            value: colTotal,
            formatted: formatPivotValue(colTotal, isCurrency),
            count: colCount,
        }
    }

    return {
        config,
        columnHeaders: columnValues,
        rowHeaders: rowValues,
        data,
        totals: columnTotals,
        grandTotal: {
            value: grandTotal,
            formatted: formatPivotValue(grandTotal, isCurrency),
            count: grandCount,
        },
    }
}

function getFieldValue(item: Record<string, unknown>, field: string): string {
    const value = item[field]
    if (value === null || value === undefined) return "(empty)"
    if (field === "date") {
        // Date-based fields get bucketed
        return String(value).slice(0, 7) // YYYY-MM format
    }
    return String(value)
}

function getDistinctValues(
    data: Array<Record<string, string>>,
    fields: PivotField[],
): string[] {
    if (fields.length === 0) return ["All"]

    const values = new Set<string>()
    for (const item of data) {
        const composite = fields
            .map((f) => getFieldValue(item, f.field))
            .join(" | ")
        values.add(composite)
    }
    return Array.from(values).sort()
}

function computeAggregation(
    items: Array<Record<string, unknown>>,
    valueFields: Array<{ field: string; aggregation: PivotAggregation }>,
): PivotCell {
    if (items.length === 0) {
        return { value: 0, formatted: "0", count: 0 }
    }

    const values = items.map((item) => {
        const v = item[valueFields[0]?.field ?? "amount"]
        return typeof v === "number" ? v : Number(v) || 0
    })

    let result = 0
    const agg = valueFields[0]?.aggregation ?? "sum"

    switch (agg) {
        case "sum":
            result = values.reduce((a, b) => a + b, 0)
            break
        case "count":
            result = items.length
            break
        case "avg":
            result = values.reduce((a, b) => a + b, 0) / items.length
            break
        case "min":
            result = Math.min(...values)
            break
        case "max":
            result = Math.max(...values)
            break
    }

    return {
        value: Math.round(result * 100) / 100,
        formatted: formatPivotValue(result, agg !== "count"),
        count: items.length,
    }
}

function formatPivotValue(value: number, isCurrency: boolean = true): string {
    return new Intl.NumberFormat('tr-TR', {
        style: isCurrency ? 'currency' : 'decimal',
        currency: 'TRY',
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(value)
}

// ── PERIOD COMPARISON ─────────────────────────────────────────────────────

export async function getPeriodComparison(
    db: PrismaClient,
    tenantId: string,
    currentPeriod: DateRange,
    previousPeriod: DateRange,
): Promise<PeriodComparisonResult> {
    const [currentData, previousData] = await Promise.all([
        getComparisonData(db, tenantId, currentPeriod),
        getComparisonData(db, tenantId, previousPeriod),
    ])

    function metric(
        label: string,
        current: number,
        previous: number,
    ): PeriodMetric {
        const change = current - previous
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0
        return {
            label,
            current,
            previous,
            change,
            changePercent: Math.round(changePercent * 100) / 100,
            direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
        }
    }

    const revenue = metric("Revenue", currentData.revenue, previousData.revenue)
    const expenses = metric("Expenses", currentData.expenses, previousData.expenses)
    const profit = metric(
        "Net Profit",
        currentData.revenue - currentData.expenses,
        previousData.revenue - previousData.expenses,
    )
    const orderCount = metric(
        "Order Count",
        currentData.orderCount,
        previousData.orderCount,
    )
    const avgOrderValue = metric(
        "Avg Order Value",
        currentData.revenue > 0 ? currentData.revenue / currentData.orderCount : 0,
        previousData.revenue > 0 ? previousData.revenue / previousData.orderCount : 0,
    )

    return {
        currentPeriod,
        previousPeriod,
        metrics: [revenue, expenses, profit, orderCount, avgOrderValue],
        revenue,
        expenses,
        profit,
        orderCount,
        averageOrderValue: avgOrderValue,
    }
}

interface ComparisonData {
    revenue: number
    expenses: number
    orderCount: number
}

async function getComparisonData(
    db: PrismaClient,
    tenantId: string,
    period: DateRange,
): Promise<ComparisonData> {
    const [revenueResult, expenseResult, orderResult] = await Promise.all([
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'INCOME'
            AND date >= ${period.start}::timestamptz
            AND date <= ${period.end}::timestamptz
        `,
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'EXPENSE'
            AND date >= ${period.start}::timestamptz
            AND date <= ${period.end}::timestamptz
        `,
        db.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count
            FROM "Order"
            WHERE "tenantId" = ${tenantId}
            AND "createdAt" >= ${period.start}::timestamptz
            AND "createdAt" <= ${period.end}::timestamptz
        `,
    ])

    return {
        revenue: Number(revenueResult[0]?.total ?? 0),
        expenses: Number(expenseResult[0]?.total ?? 0),
        orderCount: Number(orderResult[0]?.count ?? 0),
    }
}

// ── KPI CALCULATIONS ──────────────────────────────────────────────────────

export async function getDashboardKpis(
    db: PrismaClient,
    tenantId: string,
): Promise<KpiResult> {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [
        currentRevenue,
        currentExpenses,
        prevRevenue,
        prevExpenses,
        currentOrders,
        prevOrders,
        customerCount,
        prevCustomerCount,
        // Order revenue totals are computed from currentOrders/prevOrders
    ] = await Promise.all([
        // Current month revenue
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'INCOME'
            AND date >= ${firstOfMonth}::timestamptz
            AND date < ${firstOfNextMonth}::timestamptz
        `,
        // Current month expenses
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'EXPENSE'
            AND date >= ${firstOfMonth}::timestamptz
            AND date < ${firstOfNextMonth}::timestamptz
        `,
        // Previous month revenue
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'INCOME'
            AND date >= ${firstOfLastMonth}::timestamptz
            AND date < ${firstOfMonth}::timestamptz
        `,
        // Previous month expenses
        db.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(CAST(SUM(amount) AS DOUBLE PRECISION), 0) as total
            FROM "Transaction"
            WHERE "tenantId" = ${tenantId}
            AND type = 'EXPENSE'
            AND date >= ${firstOfLastMonth}::timestamptz
            AND date < ${firstOfMonth}::timestamptz
        `,
        // Current month orders
        db.$queryRaw<Array<{ count: number; total: number }>>`
            SELECT COUNT(*)::int as count,
                   COALESCE(CAST(SUM(total) AS DOUBLE PRECISION), 0) as total
            FROM "Order"
            WHERE "tenantId" = ${tenantId}
            AND "createdAt" >= ${firstOfMonth}::timestamptz
            AND "createdAt" < ${firstOfNextMonth}::timestamptz
        `,
        // Previous month orders
        db.$queryRaw<Array<{ count: number; total: number }>>`
            SELECT COUNT(*)::int as count,
                   COALESCE(CAST(SUM(total) AS DOUBLE PRECISION), 0) as total
            FROM "Order"
            WHERE "tenantId" = ${tenantId}
            AND "createdAt" >= ${firstOfLastMonth}::timestamptz
            AND "createdAt" < ${firstOfMonth}::timestamptz
        `,
        // Customer count
        db.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count
            FROM "Customer"
            WHERE "tenantId" = ${tenantId}
        `,
        // Previous customers
        db.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int as count
            FROM "Customer"
            WHERE "tenantId" = ${tenantId}
            AND "createdAt" < ${firstOfMonth}::timestamptz
        `,
    ])

    const currRev = Number(currentRevenue[0]?.total ?? 0)
    const currExp = Number(currentExpenses[0]?.total ?? 0)
    const prevRev = Number(prevRevenue[0]?.total ?? 0)
    const prevExp = Number(prevExpenses[0]?.total ?? 0)
    const currOrders = Number(currentOrders[0]?.count ?? 0)
    const currOrdersTotal = Number(currentOrders[0]?.total ?? 0)
    const prevOrdersCount = Number(prevOrders[0]?.count ?? 0)
    const prevOrdersTotal = Number(prevOrders[0]?.total ?? 0)
    const customersNow = Number(customerCount[0]?.count ?? 0)
    const customersPrev = Number(prevCustomerCount[0]?.count ?? 0)

    const currProfit = currRev - currExp
    const prevProfit = prevRev - prevExp
    const currMargin = currRev > 0 ? (currProfit / currRev) * 100 : 0
    const prevMargin = prevRev > 0 ? (prevProfit / prevRev) * 100 : 0
    const currAov = currOrders > 0 ? currOrdersTotal / currOrders : 0
    const prevAov = prevOrdersCount > 0 ? prevOrdersTotal / prevOrdersCount : 0
    const revPerCustomer = customersNow > 0 ? currRev / customersNow : 0
    const prevRevPerCustomer = customersPrev > 0 ? prevRev / customersPrev : 0

    const pct = (curr: number, prev: number) =>
        prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0

    return {
        revenue: currRev,
        revenueChange: Math.round(pct(currRev, prevRev) * 100) / 100,
        expenses: currExp,
        expensesChange: Math.round(pct(currExp, prevExp) * 100) / 100,
        profit: currProfit,
        profitChange: Math.round(pct(currProfit, prevProfit) * 100) / 100,
        profitMargin: Math.round(currMargin * 100) / 100,
        profitMarginChange: Math.round(pct(currMargin, prevMargin) * 100) / 100,
        expenseRatio: currRev > 0 ? Math.round((currExp / currRev) * 10000) / 100 : 0,
        orderCount: currOrders,
        orderCountChange: Math.round(pct(currOrders, prevOrdersCount) * 100) / 100,
        averageOrderValue: Math.round(currAov * 100) / 100,
        averageOrderValueChange: Math.round(pct(currAov, prevAov) * 100) / 100,
        customerCount: customersNow,
        customerCountChange: Math.round(pct(customersNow - customersPrev, customersPrev) * 100) / 100,
        revenuePerCustomer: Math.round(revPerCustomer * 100) / 100,
        revenuePerCustomerChange: Math.round(pct(revPerCustomer, prevRevPerCustomer) * 100) / 100,
    }
}
