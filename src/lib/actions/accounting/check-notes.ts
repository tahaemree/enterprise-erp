"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    checkNoteSchema,
    type CheckNoteFormValues,
} from "@/lib/validations/tr-accounting"
import type { Prisma } from "@prisma/client"
import { executeAction, fromZodError, type ActionResult } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== ÇEK / SENET ====================
type CheckNoteWithMapped = Omit<Prisma.CheckPromissoryNoteGetPayload<{ include: { customer: true; bankAccount: true } }>, 'amount'> & { amount: number }

export async function getCheckNotes(): Promise<CheckNoteWithMapped[]>
export async function getCheckNotes(params: PaginationParams): Promise<PaginatedResult<CheckNoteWithMapped>>
export async function getCheckNotes(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    const include = { customer: true, bankAccount: true } as const
    const mapFn = (c: { amount: unknown }) => ({ ...c, amount: Number(c.amount) }) as unknown as CheckNoteWithMapped

    if (!pagination) {
        const data = await db.checkPromissoryNote.findMany({ include, orderBy: { maturityDate: "asc" } })
        return data.map(mapFn)
    }

    const [data, total] = await Promise.all([
        db.checkPromissoryNote.findMany({ ...pagination, include, orderBy: { maturityDate: "asc" } }),
        db.checkPromissoryNote.count(),
    ])
    return createPaginatedResult(data.map(mapFn), total, params)
}

export async function createCheckNote(data: CheckNoteFormValues) : Promise<ActionResult<Prisma.CheckPromissoryNoteGetPayload<Record<string, never>>>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        const parsed = checkNoteSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)
    
        const checkNote = await db.checkPromissoryNote.create({
            data: { ...parsed.data, amount: Number(parsed.data.amount) as unknown as Prisma.Decimal, tenantId: user.tenantId },
        }) as Prisma.CheckPromissoryNoteGetPayload<Record<string, never>>
    
        logger.info("Check/Promissory note created", { module: MODULE.TR_ACCOUNTING, userId: user.id, checkNoteId: checkNote.id })
        revalidatePath(PATHS.ACCOUNTING_CHECK_NOTES)
        return checkNote
    
    })
}

