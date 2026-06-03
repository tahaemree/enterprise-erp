"use server"

import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { employeeSchema } from "@/lib/validations/hr"
import type { Prisma } from "@prisma/client"
import { NotFoundError } from "@/lib/errors"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { serializePrisma } from "@/lib/utils"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"
import { z } from "zod"

export type EmployeeWithDepartment = Prisma.EmployeeGetPayload<{ include: { department: true } }>

export interface EmployeeStats {
    total: number
    active: number
    onLeave: number
    departments: number
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const [total, active, onLeave, deptGroups] = await Promise.all([
        db.employee.count(),
        db.employee.count({ where: { status: "ACTIVE" } }),
        db.employee.count({ where: { status: "ON_LEAVE" } }),
        db.employee.groupBy({
            by: ["departmentId"],
            where: { departmentId: { not: null } },
            _count: true,
        }),
    ])

    return { total, active, onLeave, departments: deptGroups.length }
}

export async function getEmployees(): Promise<EmployeeWithDepartment[]>
export async function getEmployees(params: PaginationParams): Promise<PaginatedResult<EmployeeWithDepartment>>
export async function getEmployees(params?: PaginationParams): Promise<PaginatedResult<EmployeeWithDepartment> | EmployeeWithDepartment[]> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)

    if (!pagination) {
        return db.employee.findMany({
            include: { department: true },
            orderBy: { createdAt: "desc" },
        })
    }

    const [employees, total] = await Promise.all([
        db.employee.findMany({
            ...pagination,
            include: { department: true },
            orderBy: { createdAt: "desc" },
        }),
        db.employee.count(),
    ])

    return createPaginatedResult(employees, total, params)
}

export type EmployeeWithDetails = Prisma.EmployeeGetPayload<{
    include: { department: true; leaveRequests: true }
}>

export async function getEmployee(id: string): Promise<EmployeeWithDetails | null> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const employee = await db.employee.findFirst({
        where: { id },
        include: { department: true, leaveRequests: true },
    })

    return serializePrisma(employee)
}

export const createEmployee = validatedActionWithRole(
    "MANAGER",
    employeeSchema,
    ENTITY_TYPE.EMPLOYEE,
    PATHS.EMPLOYEES,
    async (ctx) => {
        const employee = await ctx.db.employee.create({
            data: {
                ...ctx.parsed,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.EmployeeUncheckedCreateInput,
            include: { department: true },
        })
        return employee
    },
    (parsed) => `Created employee: ${parsed.firstName} ${parsed.lastName}`
)

export const updateEmployee = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }).and(employeeSchema),
    ENTITY_TYPE.EMPLOYEE,
    PATHS.EMPLOYEES,
    async (ctx) => {
        const { id, ...data } = ctx.parsed
        const result = await ctx.db.employee.updateMany({
            where: { id },
            data,
        })
        if (result.count === 0) {
            throw new NotFoundError("Employee")
        }
        return { id }
    },
    (parsed) => `Updated employee: ${parsed.firstName} ${parsed.lastName}`,
    "UPDATE"
)

export const deleteEmployee = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.EMPLOYEE,
    PATHS.EMPLOYEES,
    async (ctx) => {
        const result = await ctx.db.employee.updateMany({
            where: { id: ctx.parsed.id },
            data: { deletedAt: new Date(), status: "TERMINATED" },
        })
        if (result.count === 0) {
            throw new NotFoundError("Employee")
        }
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted employee: ${parsed.id}`,
    "DELETE"
)
