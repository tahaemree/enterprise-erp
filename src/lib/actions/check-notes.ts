"use server"

import { requireAuth, requireManager } from "@/lib/auth-utils"
import { CheckNoteService } from "@/services/check-note.service"
import { checkNoteSchema, type CheckNoteFormValues } from "@/lib/validations/finance"
import { revalidatePath } from "next/cache"
import logger from "@/lib/logger"
import { executeAction, type ActionResult, fromZodError } from "@/lib/errors"
import { activityLogService } from "@/services/activity-log.service"
import type { Prisma } from "@prisma/client"
import { ENTITY_TYPE, MODULE, PATHS } from "@/lib/constants"

type CheckNoteResult = Omit<Prisma.CheckPromissoryNoteGetPayload<{}>, 'amount'> & { amount: number }

export async function getCheckNotes() {
    const user = await requireAuth()
    return CheckNoteService.getCheckNotes(user.tenantId)
}

export async function getCheckNote(id: string) {
    const user = await requireAuth()
    return CheckNoteService.getCheckNoteById(user.tenantId, id)
}

export async function createCheckNote(data: CheckNoteFormValues): Promise<ActionResult<CheckNoteResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)

        const parsed = checkNoteSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const note = await CheckNoteService.createCheckNote(user.tenantId, parsed.data)
        logger.info("Check/Note created", { module: MODULE.CHECK_NOTES, userId: user.id, checkNoteId: note.id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "CREATE",
            entityType: ENTITY_TYPE.CHECK_NOTE,
            entityId: note.id,
            description: `Created check/promissory note: ${note.serialNumber ?? note.id}`,
        })
        revalidatePath(PATHS.CHECK_NOTES, "page")
        return { ...note, amount: Number(note.amount) } as CheckNoteResult
    })
}

export async function updateCheckNoteStatus(id: string, status: string): Promise<ActionResult<CheckNoteResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const note = await CheckNoteService.updateCheckNoteStatus(user.tenantId, id, status)
        logger.info("Check/Note status updated", { module: MODULE.CHECK_NOTES, userId: user.id, checkNoteId: note.id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.CHECK_NOTE,
            entityId: note.id,
            description: `Updated check/promissory note status to ${status}: ${note.serialNumber ?? note.id}`,
            metadata: { newStatus: status },
        })
        revalidatePath(PATHS.CHECK_NOTES, "page")
        return { ...note, amount: Number(note.amount) } as CheckNoteResult
    })
}

export async function deleteCheckNote(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        await CheckNoteService.deleteCheckNote(user.tenantId, id)
        logger.info("Check/Note deleted", { module: MODULE.CHECK_NOTES, userId: user.id, checkNoteId: id })
        await activityLogService.log(user.id, user.tenantId, {
            action: "DELETE",
            entityType: ENTITY_TYPE.CHECK_NOTE,
            entityId: id,
            description: `Deleted check/promissory note: ${id}`,
        })
        revalidatePath(PATHS.CHECK_NOTES, "page")
    })
}
