"use server"

import { requireAuth, requireManager } from "@/lib/auth-utils"
import { CostCenterService } from "@/services/cost-center.service"
import { costCenterSchema, type CostCenterFormValues } from "@/lib/validations/finance"
import { revalidatePath } from "next/cache"
import logger from "@/lib/logger"
import { executeAction, type ActionResult, fromZodError } from "@/lib/errors"
import { activityLogService } from "@/services/activity-log.service"
import type { Prisma } from "@prisma/client"
import { ENTITY_TYPE, MODULE, PATHS } from "@/lib/constants"

type CostCenterResult = Prisma.CostCenterGetPayload<{}>

export async function getCostCenters() {
    const user = await requireAuth()
    return CostCenterService.getCostCenters(user.tenantId)
}

export async function getCostCenter(id: string) {
    const user = await requireAuth()
    return CostCenterService.getCostCenterById(user.tenantId, id)
}

export async function createCostCenter(data: CostCenterFormValues): Promise<ActionResult<CostCenterResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        
        const parsed = costCenterSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const costCenter = await CostCenterService.createCostCenter(user.tenantId, parsed.data)
        logger.info("Cost center created", { module: MODULE.COST_CENTERS, userId: user.id, costCenterId: costCenter.id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "CREATE",
            entityType: ENTITY_TYPE.COST_CENTER,
            entityId: costCenter.id,
            description: `Created cost center: ${costCenter.code} - ${costCenter.name}`,
        })
        revalidatePath(PATHS.COST_CENTERS, "page")
        return costCenter as CostCenterResult
    })
}

export async function updateCostCenter(id: string, data: CostCenterFormValues): Promise<ActionResult<CostCenterResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        
        const parsed = costCenterSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const costCenter = await CostCenterService.updateCostCenter(user.tenantId, id, parsed.data)
        logger.info("Cost center updated", { module: MODULE.COST_CENTERS, userId: user.id, costCenterId: costCenter.id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.COST_CENTER,
            entityId: costCenter.id,
            description: `Updated cost center: ${costCenter.code} - ${costCenter.name}`,
        })
        revalidatePath(PATHS.COST_CENTERS, "page")
        return costCenter as CostCenterResult
    })
}

export async function deleteCostCenter(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        await CostCenterService.deleteCostCenter(user.tenantId, id)
        logger.info("Cost center deleted", { module: MODULE.COST_CENTERS, userId: user.id, costCenterId: id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "DELETE",
            entityType: ENTITY_TYPE.COST_CENTER,
            entityId: id,
            description: `Deleted cost center: ${id}`,
        })
        revalidatePath(PATHS.COST_CENTERS, "page")
    })
}
