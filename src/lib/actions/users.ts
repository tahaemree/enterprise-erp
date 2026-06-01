"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { executeAction, NotFoundError, AuthorizationError, ValidationError, type ActionResult } from "@/lib/errors"
import { activityLogService } from "@/services/activity-log.service"
import { ENTITY_TYPE } from "@/lib/constants"
import bcrypt from "bcryptjs"
import { z } from "zod"

const profileSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export async function updateProfile(data: ProfileFormValues): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const parsed = profileSchema.parse(data)

        const currentUser = await db.user.findUnique({ where: { id: user.id } })
        if (!currentUser) throw new NotFoundError("User")

        const updateData: { name: string; email: string; password?: string } = {
            name: parsed.name,
            email: parsed.email,
        }

        if (parsed.newPassword) {
            if (!parsed.currentPassword) {
                throw new ValidationError("Current password is required to set a new password")
            }
            if (!currentUser.password) {
                throw new ValidationError("Cannot verify current password")
            }
            const isValid = await bcrypt.compare(parsed.currentPassword, currentUser.password)
            if (!isValid) {
                throw new AuthorizationError("Invalid current password")
            }
            updateData.password = await bcrypt.hash(parsed.newPassword, 10)
        }

        await db.user.update({
            where: { id: user.id },
            data: updateData,
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.USER,
            entityId: user.id,
            description: "Updated profile information",
        })

        revalidatePath("/settings/profile")
    })
}
export async function updatePermissions({ id, permissions }: { id: string, permissions: string[] }): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        if (user.role !== "ADMIN") {
            throw new AuthorizationError("Only admins can manage permissions")
        }
        const db = getTenantPrisma(user.tenantId)
        
        await db.user.update({
            where: { id, tenantId: user.tenantId },
            data: { permissions }
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.USER,
            entityId: id,
            description: `Updated permissions for user ${id}: [${permissions.join(", ")}]`,
        })

        revalidatePath("/settings/permissions")
    })
}
