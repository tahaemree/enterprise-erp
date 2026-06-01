"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import crypto from "crypto"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    accountEntrySchema,
    type AccountEntryFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { fromZodError, NotFoundError, ConflictError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS, ENTITY_TYPE } from "@/lib/constants"
import { validatedActionWithRole } from "@/lib/action-wrapper"

// ==================== MUHASEBE FİŞİ ====================

export type AccountEntryWithMapped = Omit<Prisma.AccountEntryGetPayload<{ include: { lines: true } }>, 'lines'> & { lines: Array<Omit<Prisma.AccountEntryLineGetPayload<{}>, 'amount'> & { amount: number }> }

export async function getAccountEntries(): Promise<AccountEntryWithMapped[]>
export async function getAccountEntries(params: PaginationParams): Promise<PaginatedResult<AccountEntryWithMapped>>
export async function getAccountEntries(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    const include = { lines: true } as const
    const mapFn = (e: { lines: Array<{ amount: unknown }> }) => ({
        ...e,
        lines: e.lines.map((line) => ({ ...line, amount: Number(line.amount) })),
    }) as unknown as AccountEntryWithMapped

    if (!pagination) {
        const data = await db.accountEntry.findMany({ include, orderBy: { entryDate: "desc" } })
        return data.map(mapFn)
    }

    const [data, total] = await Promise.all([
        db.accountEntry.findMany({ ...pagination, include, orderBy: { entryDate: "desc" } }),
        db.accountEntry.count(),
    ])
    return createPaginatedResult(data.map(mapFn), total, params)
}

export const createAccountEntry = validatedActionWithRole(
    "MANAGER",
    accountEntrySchema,
    ENTITY_TYPE.ACCOUNT_ENTRY,
    PATHS.ENTRIES,
    async (ctx) => {
        // Generate entry number: F-YYYYMM-UUID
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
        const entryNumber = `F-${yearMonth}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    
        const entry = await ctx.db.accountEntry.create({
            data: {
                entryNumber,
                entryType: ctx.parsed.entryType,
                description: ctx.parsed.description,
                entryDate: ctx.parsed.entryDate,
                tenantId: ctx.user.tenantId,
                lines: {
                    create: ctx.parsed.lines.map((line) => ({
                        side: line.side,
                        amount: line.amount,
                        description: line.description,
                        costCenterId: line.costCenterId,
                        customerAccountId: line.customerAccountId,
                        supplierAccountId: line.supplierAccountId,
                        bankAccountId: line.bankAccountId,
                        checkNoteId: line.checkNoteId,
                    })),
                },
            },
            include: { lines: true },
        })
    
        return entry
    },
    (parsed) => `Created account entry: ${parsed.entryType} - ${parsed.description}`
)

