/**
 * Deftra — Activity Log Server Actions
 *
 * Provides server actions for querying the activity log with
 * pagination, filtering, and search.
 */

"use server"

import { requireAuth } from "@/lib/auth-utils"
import { activityLogService } from "@/services/activity-log.service"
import { executeAction } from "@/lib/errors"
import type { EntityType, LogAction } from "@/services/activity-log.service"

export interface GetActivityLogsParams {
    page?: number
    pageSize?: number
    entityType?: EntityType
    action?: LogAction
    userId?: string
    startDate?: string
    endDate?: string
    search?: string
}

/**
 * Fetches paginated activity logs for the current tenant.
 */
export async function getActivityLogs(params: GetActivityLogsParams = {}) {
    return executeAction(async () => {
        const user = await requireAuth()

        const result = await activityLogService.getLogs(user.tenantId, {
            ...params,
            startDate: params.startDate ? new Date(params.startDate) : undefined,
            endDate: params.endDate ? new Date(params.endDate) : undefined,
        })

        return result
    })
}

/**
 * Fetches recent activity logs for the dashboard widget.
 */
export async function getRecentActivityLogs(limit: number = 10) {
    return executeAction(async () => {
        const user = await requireAuth()
        return activityLogService.getRecentLogs(user.tenantId, limit)
    })
}

/**
 * Gets the total count of activity logs for the current tenant.
 */
export async function getActivityLogCount() {
    return executeAction(async () => {
        const user = await requireAuth()
        return activityLogService.getLogCount(user.tenantId)
    })
}

/**
 * Logs an activity entry for the current authenticated user.
 * Used by other server actions to record events.
 */
export async function createActivityLog(
    action: LogAction,
    entityType: EntityType,
    entityId: string | undefined,
    description: string,
    metadata?: Record<string, unknown>
) {
    return executeAction(async () => {
        const user = await requireAuth()
        await activityLogService.log(user.id, user.tenantId, {
            action,
            entityType,
            entityId,
            description,
            metadata,
        })
    })
}
