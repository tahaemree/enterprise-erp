/**
 * Deftra — Activity Log Service
 *
 * Provides logging and querying capabilities for the ActivityLog model.
 * All server actions should call this service to record significant events.
 */

import { getTenantPrisma } from "@/lib/prisma"
import logger from "@/lib/logger"
import type { ActivityLog, Prisma } from "@prisma/client"

export type LogAction = "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL" | "SEND" | "VIEW" | "LOGIN" | "LOGOUT" | "EXPORT" | "IMPORT"

export type EntityType =
    | "PRODUCT"
    | "CATEGORY"
    | "SUPPLIER"
    | "CUSTOMER"
    | "ORDER"
    | "INVOICE"
    | "TRANSACTION"
    | "BANK_ACCOUNT"
    | "CHECK_NOTE"
    | "COST_CENTER"
    | "ACCOUNT_ENTRY"
    | "EMPLOYEE"
    | "DEPARTMENT"
    | "LEAVE_REQUEST"
    | "TAX_TYPE"
    | "EXCHANGE_RATE"
    | "CURRENCY"
    | "EINVOICE"
    | "BA_BS_FORM"
    | "USER"
    | "SETTING"
    | "ACTIVITY_LOG"

export interface LogEntryParams {
    action: LogAction
    entityType: EntityType
    entityId?: string
    description: string
    metadata?: Record<string, unknown>
}

export interface ActivityLogQueryParams {
    page?: number
    pageSize?: number
    entityType?: EntityType
    entityId?: string
    action?: LogAction
    userId?: string
    startDate?: Date
    endDate?: Date
    search?: string
}

/** Activity log with the included user relation */
export type ActivityLogWithUser = ActivityLog & {
    user: {
        id: string
        name: string | null
        email: string | null
    } | null
}

export interface PaginatedActivityLogs {
    logs: ActivityLogWithUser[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

const DEFAULT_PAGE_SIZE = 50

class ActivityLogService {
    /**
     * Creates an activity log entry.
     * This is the central audit trail — all significant actions should call this.
     * Returns void — logging failures are silently handled.
     */
    async log(
        userId: string,
        tenantId: string,
        params: LogEntryParams
    ): Promise<void> {
        try {
            const db = getTenantPrisma(tenantId)
            await db.activityLog.create({
                data: {
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    description: params.description,
                    metadata: params.metadata as Prisma.InputJsonValue | undefined,
                    userId,
                    tenantId,
                },
            })

            logger.debug("Activity log created", {
                module: "activity-log",
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
            })
        } catch (error) {
            logger.error("Failed to create activity log", {
                module: "activity-log",
                action: params.action,
                entityType: params.entityType,
                error: {
                    message: error instanceof Error ? error.message : String(error),
                },
            })
            // Activity logging should NEVER throw — it's fire-and-forget
        }
    }

    /**
     * Queries activity logs with pagination, filtering, and search.
     */
    async getLogs(
        tenantId: string,
        params: ActivityLogQueryParams = {}
    ): Promise<PaginatedActivityLogs> {
        const {
            page = 1,
            pageSize = DEFAULT_PAGE_SIZE,
            entityType,
            entityId,
            action,
            userId,
            startDate,
            endDate,
            search,
        } = params

        // Build where clause dynamically
        const where: Prisma.ActivityLogFindManyArgs["where"] = {
            tenantId,
        }

        if (entityType) where.entityType = entityType
        if (entityId) where.entityId = entityId
        if (action) where.action = action
        if (userId) where.userId = userId

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) where.createdAt.gte = startDate
            if (endDate) where.createdAt.lte = endDate
        }

        // Text search on description
        if (search) {
            where.description = {
                contains: search,
                mode: "insensitive",
            }
        }

        const include = {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        } satisfies Prisma.ActivityLogInclude

        const db = getTenantPrisma(tenantId)
        const [logs, total] = await Promise.all([
            db.activityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include,
            }),
            db.activityLog.count({ where }),
        ])

        return {
            logs: logs as ActivityLogWithUser[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        }
    }

    /**
     * Gets the most recent activity logs (for dashboard widgets, etc.)
     */
    async getRecentLogs(
        tenantId: string,
        limit: number = 10
    ): Promise<ActivityLogWithUser[]> {
        const db = getTenantPrisma(tenantId)
        const logs = await db.activityLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return logs as ActivityLogWithUser[]
    }

    /**
     * Gets the count of activity logs matching a filter.
     */
    async getLogCount(
        tenantId: string,
        params: { startDate?: Date; endDate?: Date } = {}
    ): Promise<number> {
        const where: Prisma.ActivityLogCountArgs["where"] = { tenantId }

        if (params.startDate || params.endDate) {
            where.createdAt = {}
            if (params.startDate) where.createdAt.gte = params.startDate
            if (params.endDate) where.createdAt.lte = params.endDate
        }

        const db = getTenantPrisma(tenantId)
        return db.activityLog.count({ where })
    }
}

export const activityLogService = new ActivityLogService()
