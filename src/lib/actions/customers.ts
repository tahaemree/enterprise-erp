"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import { customerSchema, type CustomerFormValues } from "@/lib/validations/crm"
import type { Prisma } from "@prisma/client"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import type { Customer } from "@prisma/client"
import { z } from "zod"
import { NotFoundError, type ActionResult } from "@/lib/errors"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { serializePrisma } from "@/lib/utils"
import { ENTITY_TYPE, MODULE, PATHS } from "@/lib/constants"

export async function getCustomers(): Promise<Customer[]>
export async function getCustomers(params: PaginationParams): Promise<PaginatedResult<Customer>>
export async function getCustomers(params?: PaginationParams): Promise<PaginatedResult<Customer> | Customer[]> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)
    
    // Build where clause based on search parameter
    let where: Prisma.CustomerWhereInput = {}
    if (params?.search) {
        where = {
            OR: [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { company: { contains: params.search, mode: 'insensitive' } }
            ]
        }
    }

    if (!pagination) {
        const customers = await db.customer.findMany({
            where,
            orderBy: { createdAt: "desc" },
        })
        return serializePrisma(customers)
    }

    const [customers, total] = await Promise.all([
        db.customer.findMany({
            ...pagination,
            where,
            orderBy: { createdAt: "desc" },
        }),
        db.customer.count({ where }),
    ])

    return createPaginatedResult(serializePrisma(customers), total, params)
}

export async function getCustomerMetrics() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const [totalCustomers, activeCustomers, leads, totalRevenueAggr] = await Promise.all([
        db.customer.count(),
        db.customer.count({ where: { status: "CUSTOMER" } }),
        db.customer.count({ where: { status: { in: ["LEAD", "QUALIFIED", "OPPORTUNITY", "PROPOSAL", "NEGOTIATION"] } } }),
        db.customer.aggregate({ _sum: { totalSpent: true } })
    ])

    return {
        totalCustomers,
        activeCustomers,
        leads,
        totalRevenue: Number(totalRevenueAggr._sum.totalSpent || 0)
    }
}

export async function getCustomer(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const customer = await db.customer.findFirst({
        where: { id },
        include: { orders: true, interactions: true, customerAccount: true },
    })
    
    return serializePrisma(customer)
}

export const createCustomer = validatedActionWithRole(
    "MANAGER",
    customerSchema,
    ENTITY_TYPE.CUSTOMER,
    PATHS.CUSTOMERS,
    async (ctx) => {
        const customer = await ctx.db.customer.create({
            data: {
                ...ctx.parsed,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.CustomerUncheckedCreateInput,
        })
        return serializePrisma(customer)
    },
    (parsed) => `Created customer: ${parsed.firstName} ${parsed.lastName}`
)

export const updateCustomer = validatedActionWithRole(
    "MANAGER",
    customerSchema.extend({ id: z.string() }),
    ENTITY_TYPE.CUSTOMER,
    PATHS.CUSTOMERS,
    async (ctx) => {
        const { id, ...data } = ctx.parsed

        const result = await ctx.db.customer.updateMany({
            where: { id },
            data,
        })

        if (result.count === 0) {
            throw new NotFoundError("Customer")
        }

        return { id }
    },
    (parsed) => `Updated customer: ${parsed.firstName} ${parsed.lastName}`
)

export const deleteCustomer = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string() }),
    ENTITY_TYPE.CUSTOMER,
    PATHS.CUSTOMERS,
    async (ctx) => {
        const { id } = ctx.parsed

        const result = await ctx.db.customer.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
        })

        if (result.count === 0) {
            throw new NotFoundError("Customer")
        }

        return { id }
    },
    (parsed) => `Soft-deleted customer: ${parsed.id}`
)

export async function getCustomersByStatus() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.customer.groupBy({
        by: ["status"],
        _count: true,
    })
}
