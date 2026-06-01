"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    baBsFormSchema,
    type BaBsFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, NotFoundError, ConflictError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== BA/BS ====================
export async function getBaBsForms() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.baBsForm.findMany({
        include: { items: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    })
}

export async function createBaBsForm(data: BaBsFormValues) : Promise<ActionResult<Prisma.BaBsFormGetPayload<{ include: { items: true } }>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = baBsFormSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const form = await db.baBsForm.create({
            data: {
                formType: parsed.data.formType,
                year: parsed.data.year,
                month: parsed.data.month,
                tenantId: user.tenantId,
                items: {
                    create: parsed.data.items.map((item) => ({
                        taxId: item.taxId,
                        name: item.name,
                        documentCount: item.documentCount,
                        totalAmount: item.totalAmount,
                    })),
                },
            },
            include: { items: true },
        })
    
        logger.info("BA/BS form created", { module: MODULE.TR_ACCOUNTING, userId: user.id, formId: form.id })
        revalidatePath(PATHS.BA_BS)
        return form
    
    })
}

