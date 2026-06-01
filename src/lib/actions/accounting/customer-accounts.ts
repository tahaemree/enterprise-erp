"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    customerAccountSchema,
    type CustomerAccountFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, NotFoundError, ConflictError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== CARİ HESAP ====================
type CustomerAccountWithMapped = Omit<Prisma.CustomerAccountGetPayload<{ include: { customer: true } }>, 'currentBalance' | 'overdueBalance' | 'riskLimit'> & { currentBalance: number; overdueBalance: number; riskLimit: number }

export async function getCustomerAccounts(): Promise<CustomerAccountWithMapped[]>
export async function getCustomerAccounts(params: PaginationParams): Promise<PaginatedResult<CustomerAccountWithMapped>>
export async function getCustomerAccounts(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    const include = { customer: true } as const
    const mapFn = (a: { currentBalance: unknown; overdueBalance: unknown; riskLimit: unknown }) => ({
        ...a,
        currentBalance: Number(a.currentBalance),
        overdueBalance: Number(a.overdueBalance),
        riskLimit: Number(a.riskLimit),
    }) as unknown as CustomerAccountWithMapped

    if (!pagination) {
        const data = await db.customerAccount.findMany({ include, orderBy: { accountCode: "asc" } })
        return data.map(mapFn)
    }

    const [data, total] = await Promise.all([
        db.customerAccount.findMany({ ...pagination, include, orderBy: { accountCode: "asc" } }),
        db.customerAccount.count(),
    ])
    return createPaginatedResult(data.map(mapFn), total, params)
}

export async function createCustomerAccount(customerId: string, data: CustomerAccountFormValues) : Promise<ActionResult<Prisma.CustomerAccountGetPayload<{}>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = customerAccountSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const account = await db.customerAccount.create({
            data: { ...parsed.data, customerId, tenantId: user.tenantId },
        })
    
        logger.info("Customer account created", { module: MODULE.TR_ACCOUNTING, userId: user.id, customerId, accountId: account.id })
        revalidatePath(PATHS.CUSTOMER_ACCOUNTS)
        return account
    
    })
}

