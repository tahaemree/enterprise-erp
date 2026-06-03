"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import {
    inflationCoefficientSchema,
    type InflationCoefficientFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== ENFLASYON MUHASEBESİ ====================
export async function getInflationCoefficients() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.inflationCoefficient.findMany({
        orderBy: [{ year: "desc" }, { month: "desc" }],
    })
}

export async function createInflationCoefficient(data: InflationCoefficientFormValues) : Promise<ActionResult<Prisma.InflationCoefficientGetPayload<Record<string, never>>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = inflationCoefficientSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const coefficient = await db.inflationCoefficient.create({
            data: { ...parsed.data, tenantId: user.tenantId },
        })
    
        logger.info("Inflation coefficient created", { module: MODULE.TR_ACCOUNTING, userId: user.id, coefficientId: coefficient.id })
        revalidatePath(PATHS.INFLATION_COEFFICIENTS)
        return coefficient
    
    })
}

