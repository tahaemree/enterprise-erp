"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/finance"
import type { Prisma } from "@prisma/client"
import { NotFoundError } from "@/lib/errors"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"
import { z } from "zod"

type TransactionWithMapped = Prisma.TransactionGetPayload<{}> & { amount: number }

export interface TransactionStats {
    totalIncome: number
    totalExpenses: number
}

export async function getTransactionStats(): Promise<TransactionStats> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const grouped = await db.transaction.groupBy({
        by: ["type"],
        where: { type: { in: ["INCOME", "EXPENSE"] } },
        _sum: { amount: true },
    })

    const totalIncome = Number(grouped.find((g) => g.type === "INCOME")?._sum.amount ?? 0)
    const totalExpenses = Number(grouped.find((g) => g.type === "EXPENSE")?._sum.amount ?? 0)

    return { totalIncome, totalExpenses }
}

export async function getTransactions(): Promise<TransactionWithMapped[]>
export async function getTransactions(params: PaginationParams): Promise<PaginatedResult<TransactionWithMapped>>
export async function getTransactions(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const typeFilter = params?.type
        ? {
              type: (params.type === "income"
                  ? "INCOME"
                  : params.type === "expenses"
                  ? "EXPENSE"
                  : params.type) as "INCOME" | "EXPENSE" | "REFUND" | "TRANSFER",
          }
        : {}

    const pagination = getPaginationArgs(params)

    if (!pagination) {
        const transactions = await db.transaction.findMany({
            where: { ...typeFilter },
            orderBy: { date: "desc" },
        })
        return transactions.map(mapTransaction)
    }

    const [transactions, total] = await Promise.all([
        db.transaction.findMany({
            ...pagination,
            where: { ...typeFilter },
            orderBy: { date: "desc" },
        }),
        db.transaction.count({ where: { ...typeFilter } }),
    ])

    return createPaginatedResult(
        transactions.map(mapTransaction),
        total,
        params
    )
}

function mapTransaction(t: { amount: unknown }) {
    return { ...t, amount: Number(t.amount) }
}

export async function getTransaction(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.transaction.findFirst({
        where: { id },
    })
}

export const createTransaction = validatedActionWithRole(
    "MANAGER",
    transactionSchema,
    ENTITY_TYPE.TRANSACTION,
    PATHS.TRANSACTIONS,
    async (ctx) => {
        const transaction = await ctx.db.transaction.create({
            data: {
                ...ctx.parsed,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.TransactionUncheckedCreateInput,
        })
        return transaction
    },
    (parsed) => `Created transaction: ${parsed.description}`
)

export const updateTransaction = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }).and(transactionSchema),
    ENTITY_TYPE.TRANSACTION,
    PATHS.TRANSACTIONS,
    async (ctx) => {
        const { id, ...data } = ctx.parsed
        const result = await ctx.db.transaction.updateMany({
            where: { id },
            data,
        })
        if (result.count === 0) {
            throw new NotFoundError("Transaction")
        }
        return { id }
    },
    (parsed) => `Updated transaction: ${parsed.id}`,
    "UPDATE"
)

export const deleteTransaction = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.TRANSACTION,
    PATHS.TRANSACTIONS,
    async (ctx) => {
        await ctx.db.transaction.updateMany({
            where: { id: ctx.parsed.id },
            data: { deletedAt: new Date() },
        })
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted transaction: ${parsed.id}`,
    "DELETE"
)
