"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import {
    taxTypeSchema,
    type TaxTypeFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== VERGİ TÜRÜ ====================
export async function getTaxTypes() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.taxType.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
    })
}

export async function createTaxType(data: TaxTypeFormValues) : Promise<ActionResult<Prisma.TaxTypeGetPayload<Record<string, never>>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = taxTypeSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const taxType = await db.taxType.create({
            data: { ...parsed.data, tenantId: user.tenantId },
        })
    
        logger.info("Tax type created", { module: MODULE.TR_ACCOUNTING, userId: user.id, taxTypeId: taxType.id })
        revalidatePath(PATHS.TAX_TYPES)
        return taxType
    
    })
}

