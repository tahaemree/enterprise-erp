"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import { leaveRequestSchema, type LeaveRequestFormData } from "@/lib/validations/hr"
import type { Prisma } from "@prisma/client"
import { fromZodError, executeAction, type ActionResult } from "@/lib/errors"
import logger from "@/lib/logger"
import { activityLogService } from "@/services/activity-log.service"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { ENTITY_TYPE, MODULE, PATHS } from "@/lib/constants"

type LeaveRequestWithEmployee = Prisma.LeaveRequestGetPayload<{
    include: { employee: { include: { department: true } } }
}>

export async function getLeaveRequests(): Promise<LeaveRequestWithEmployee[]>
export async function getLeaveRequests(params: PaginationParams): Promise<PaginatedResult<LeaveRequestWithEmployee>>
export async function getLeaveRequests(params?: PaginationParams): Promise<PaginatedResult<LeaveRequestWithEmployee> | LeaveRequestWithEmployee[]> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)

    if (!pagination) {
        return db.leaveRequest.findMany({
            where: {},
            include: {
                employee: { include: { department: true } },
            },
            orderBy: { createdAt: "desc" },
        })
    }

    const [leaveRequests, total] = await Promise.all([
        db.leaveRequest.findMany({
            ...pagination,
            where: {},
            include: {
                employee: { include: { department: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        db.leaveRequest.count({ where: {} }),
    ])

    return createPaginatedResult(leaveRequests, total, params)
}

export async function getLeaveRequest(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.leaveRequest.findFirst({
        where: { id },
        include: { employee: true },
    })
}

export async function createLeaveRequest(data: LeaveRequestFormData): Promise<ActionResult<Prisma.LeaveRequestGetPayload<{}>>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const parsed = leaveRequestSchema.safeParse(data)
        if (!parsed.success) {
            throw fromZodError(parsed.error)
        }

        // Calculate total days
        const timeDiff = parsed.data.endDate.getTime() - parsed.data.startDate.getTime()
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

        const leaveRequest = await db.leaveRequest.create({
            data: {
                ...parsed.data,
                totalDays,
                tenantId: user.tenantId,
            } satisfies Prisma.LeaveRequestUncheckedCreateInput,
        })

        logger.info("Leave request created", {
            module: MODULE.LEAVE_REQUESTS,
            userId: user.id,
            tenantId: user.tenantId,
            leaveRequestId: leaveRequest.id,
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "CREATE",
            entityType: ENTITY_TYPE.LEAVE_REQUEST,
            entityId: leaveRequest.id,
            description: `Created leave request: ${leaveRequest.type} (${leaveRequest.startDate.toISOString().slice(0,10)} - ${leaveRequest.endDate.toISOString().slice(0,10)})`,
        })

        revalidatePath(PATHS.LEAVE)
        return leaveRequest
    })
}

export async function updateLeaveRequestStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED"
): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)

        await db.leaveRequest.updateMany({
            where: { id },
            data: {
                status,
                reviewedBy: user.id,
                reviewedAt: new Date(),
            },
        })

        logger.info("Leave request status updated", {
            module: MODULE.LEAVE_REQUESTS,
            userId: user.id,
            tenantId: user.tenantId,
            leaveRequestId: id,
            newStatus: status,
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "CANCEL",
            entityType: ENTITY_TYPE.LEAVE_REQUEST,
            entityId: id,
            description: `${status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Cancelled"} leave request: ${id}`,
        })

        revalidatePath(PATHS.LEAVE)
    })
}

export async function deleteLeaveRequest(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)

        await db.leaveRequest.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
        })

        logger.info("Leave request deleted", {
            module: MODULE.LEAVE_REQUESTS,
            userId: user.id,
            tenantId: user.tenantId,
            leaveRequestId: id,
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "DELETE",
            entityType: ENTITY_TYPE.LEAVE_REQUEST,
            entityId: id,
            description: `Deleted leave request: ${id}`,
        })

        revalidatePath(PATHS.LEAVE)
    })
}
