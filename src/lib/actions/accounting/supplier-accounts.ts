"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    supplierAccountSchema,
    type SupplierAccountFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== TEDARİKÇİ CARİ HESAP ====================
type SupplierAccountWithMapped = Omit<Prisma.SupplierAccountGetPayload<{ include: { supplier: true } }>, 'currentBalance' | 'overdueBalance' | 'riskLimit'> & { currentBalance: number; overdueBalance: number; riskLimit: number }

export async function getSupplierAccounts(): Promise<SupplierAccountWithMapped[]>
export async function getSupplierAccounts(params: PaginationParams): Promise<PaginatedResult<SupplierAccountWithMapped>>
export async function getSupplierAccounts(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    const include = { supplier: true } as const
    const mapFn = (a: { currentBalance: unknown; overdueBalance: unknown; riskLimit: unknown }) => ({
        ...a,
        currentBalance: Number(a.currentBalance),
        overdueBalance: Number(a.overdueBalance),
        riskLimit: Number(a.riskLimit),
    }) as unknown as SupplierAccountWithMapped

    if (!pagination) {
        const data = await db.supplierAccount.findMany({ include, orderBy: { accountCode: "asc" } })
        return data.map(mapFn)
    }

    const [data, total] = await Promise.all([
        db.supplierAccount.findMany({ ...pagination, include, orderBy: { accountCode: "asc" } }),
        db.supplierAccount.count(),
    ])
    return createPaginatedResult(data.map(mapFn), total, params)
}

export async function createSupplierAccount(supplierId: string, data: SupplierAccountFormValues) : Promise<ActionResult<Prisma.SupplierAccountGetPayload<Record<string, never>>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = supplierAccountSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const account = await db.supplierAccount.create({
            data: { ...parsed.data, supplierId, tenantId: user.tenantId },
        })
    
        logger.info("Supplier account created", { module: MODULE.TR_ACCOUNTING, userId: user.id, supplierId, accountId: account.id })
        revalidatePath(PATHS.SUPPLIER_ACCOUNTS)
        return account
    
    })
}
