/**
 * Deftra — Notification Server Actions
 *
 * Provides server actions for notification management with
 * consistent error handling via executeAction pattern.
 */

"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { executeAction, type ActionResult } from "@/lib/errors"
import { sseEmitter } from "@/lib/sse-emitter"

export async function getNotifications(): Promise<ActionResult<Array<{
    id: string
    title: string
    description: string | null
    isRead: boolean
    createdAt: Date
    link: string | null
    color: string | null
}>>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const notifications = await db.notification.findMany({
            where: {
                tenantId: user.tenantId,
                userId: user.id,
                isRead: false,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        })

        return notifications
    })
}

export async function getAllNotifications(): Promise<ActionResult<Array<{
    id: string
    title: string
    description: string | null
    isRead: boolean
    createdAt: Date
    link: string | null
    color: string | null
}>>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const notifications = await db.notification.findMany({
            where: {
                tenantId: user.tenantId,
                userId: user.id,
            },
            orderBy: { createdAt: "desc" },
            take: 100, // Fetch up to 100 recent notifications for the page
        })

        return notifications
    })
}

export async function markAsRead(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        await db.notification.update({
            where: { id, tenantId: user.tenantId, userId: user.id },
            data: { isRead: true },
        })

        revalidatePath("/", "layout")
    })
}

export async function markAllAsRead(): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        await db.notification.updateMany({
            where: { tenantId: user.tenantId, userId: user.id, isRead: false },
            data: { isRead: true },
        })

        revalidatePath("/", "layout")
    })
}

export async function createNotification(data: {
    userId: string
    title: string
    description?: string
    color?: string
    link?: string
}): Promise<ActionResult<{ id: string }>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const notification = await db.notification.create({
            data: {
                ...data,
                tenantId: user.tenantId,
            },
            select: { id: true, title: true, description: true, color: true, createdAt: true },
        })

        sseEmitter.emit("notification", user.tenantId, data.userId, notification)

        revalidatePath("/", "layout")
        return { id: notification.id }
    })
}
