"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    costCenterSchema,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, NotFoundError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS, ENTITY_TYPE } from "@/lib/constants"
import { validatedActionWithRole } from "@/lib/action-wrapper"

// ==================== MASRAF MERKEZİ ====================
type CostCenterWithMapped = Prisma.CostCenterGetPayload<Record<string, never>>

export async function getCostCenters(): Promise<CostCenterWithMapped[]>
export async function getCostCenters(params: PaginationParams): Promise<PaginatedResult<CostCenterWithMapped>>
export async function getCostCenters(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    if (!pagination) {
        return db.costCenter.findMany({ orderBy: { code: "asc" } })
    }

    const [data, total] = await Promise.all([
        db.costCenter.findMany({ ...pagination, orderBy: { code: "asc" } }),
        db.costCenter.count(),
    ])
    return createPaginatedResult(data, total, params)
}

export const createCostCenter = validatedActionWithRole(
    "MANAGER",
    costCenterSchema,
    ENTITY_TYPE.COST_CENTER,
    PATHS.ACCOUNTING_COST_CENTERS,
    async (ctx) => {
        const costCenter = await ctx.db.costCenter.create({
            data: { ...ctx.parsed, tenantId: ctx.user.tenantId },
        })
        return costCenter
    }
)

export async function deleteCostCenter(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)

        const result = await db.costCenter.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
        })

        if (result.count === 0) {
            throw new NotFoundError("Cost Center")
        }

        logger.info("Cost center soft-deleted", { module: MODULE.TR_ACCOUNTING, userId: user.id, costCenterId: id })
        revalidatePath(PATHS.ACCOUNTING_COST_CENTERS)
    })
}
