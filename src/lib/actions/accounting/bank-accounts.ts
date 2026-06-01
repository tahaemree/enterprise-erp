"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    bankAccountSchema,
    type BankAccountFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { fromZodError, NotFoundError, ConflictError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS, ENTITY_TYPE } from "@/lib/constants"
import { validatedActionWithRole } from "@/lib/action-wrapper"

// ==================== BANKA HESABI ====================
type BankAccountWithMapped = Prisma.BankAccountGetPayload<{}>

export async function getBankAccounts(): Promise<BankAccountWithMapped[]>
export async function getBankAccounts(params: PaginationParams): Promise<PaginatedResult<BankAccountWithMapped>>
export async function getBankAccounts(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    if (!pagination) {
        return db.bankAccount.findMany({ orderBy: { bankName: "asc" } })
    }

    const [data, total] = await Promise.all([
        db.bankAccount.findMany({ ...pagination, orderBy: { bankName: "asc" } }),
        db.bankAccount.count(),
    ])
    return createPaginatedResult(data, total, params)
}

export const createBankAccount = validatedActionWithRole(
    "MANAGER",
    bankAccountSchema,
    ENTITY_TYPE.BANK_ACCOUNT,
    PATHS.ACCOUNTING_BANK_ACCOUNTS,
    async (ctx) => {
        const bankAccount = await ctx.db.bankAccount.create({
            data: { ...ctx.parsed, tenantId: ctx.user.tenantId },
        })
        return bankAccount
    }
)
