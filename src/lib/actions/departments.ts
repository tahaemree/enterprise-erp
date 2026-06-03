"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"
import { departmentSchema, type DepartmentFormData } from "@/lib/validations/hr"
import type { Prisma } from "@prisma/client"
import { fromZodError, executeAction, type ActionResult } from "@/lib/errors"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { getTenantPrisma } from "@/lib/prisma"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { activityLogService } from "@/services/activity-log.service"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"

export type DepartmentWithManager = {
    id: string
    name: string
    description: string | null
    budget: number | null
    employeeCount: number
    headcount: number
    manager: { id: string; firstName: string; lastName: string } | null
}

export async function getDepartments(): Promise<DepartmentWithManager[]>
export async function getDepartments(params: PaginationParams): Promise<PaginatedResult<DepartmentWithManager>>
export async function getDepartments(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)
    const query = {
        where: {},
        include: {
            _count: { select: { employees: { where: {} } } },
            employees: {
                where: { managerId: { not: null } },
                take: 1,
                select: {
                    manager: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" as const },
    }

    if (!pagination) {
        const departments = await db.department.findMany(query)
        return departments.map(mapDepartment)
    }

    const [departments, total] = await Promise.all([
        db.department.findMany({ ...pagination, ...query }),
        db.department.count({ where: {} }),
    ])

    return createPaginatedResult(departments.map(mapDepartment), total, params)
}

function mapDepartment(d: {
    id: string
    name: string
    description: string | null
    budget: unknown | null
    _count: { employees: number }
    employees: Array<{ manager: { id: string; firstName: string; lastName: string } | null }>
}): DepartmentWithManager {
    return {
        id: d.id,
        name: d.name,
        description: d.description,
        budget: d.budget ? Number(d.budget) : null,
        employeeCount: d._count.employees,
        headcount: d._count.employees,
        manager: d.employees[0]?.manager ?? null,
    }
}

export async function getDepartment(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.department.findFirst({
        where: { id },
        include: { employees: { where: {} } },
    })
}

/**
 * Creates a new department.
 * Uses validatedActionWithRole for consistent auth, role check, validation, logging, and revalidation.
 */
export const createDepartment = validatedActionWithRole(
    "MANAGER",
    departmentSchema,
    ENTITY_TYPE.DEPARTMENT,
    PATHS.DEPARTMENTS,
    async (ctx) => {
        const department = await ctx.db.department.create({
            data: {
                ...ctx.parsed,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.DepartmentUncheckedCreateInput,
        })
        return department
    },
    (parsed) => `Created department: ${parsed.name}`
)

/**
 * Updates an existing department.
 */
export async function updateDepartment(id: string, data: DepartmentFormData): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        const parsed = departmentSchema.safeParse(data)
        if (!parsed.success) {
            throw fromZodError(parsed.error)
        }

        await db.department.updateMany({
            where: { id },
            data: parsed.data,
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.DEPARTMENT,
            entityId: id,
            description: `Updated department: ${parsed.data.name}`,
        })

        revalidatePath(PATHS.DEPARTMENTS)
    })
}

/**
 * Deletes a department.
 */
export async function deleteDepartment(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        const db = getTenantPrisma(user.tenantId)

        await db.department.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
        })

        await activityLogService.log(user.id, user.tenantId, {
            action: "DELETE",
            entityType: ENTITY_TYPE.DEPARTMENT,
            entityId: id,
            description: `Deleted department: ${id}`,
        })

        revalidatePath(PATHS.DEPARTMENTS)
    })
}
