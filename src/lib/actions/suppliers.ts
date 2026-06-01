"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { supplierSchema, type SupplierFormValues } from "@/lib/validations/inventory"
import type { Prisma } from "@prisma/client"
import logger from "@/lib/logger"
import { NotFoundError, type ActionResult } from "@/lib/errors"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { ENTITY_TYPE, MODULE, PATHS } from "@/lib/constants"
import { z } from "zod"

type SupplierWithMapped = Prisma.SupplierGetPayload<{
    include: { _count: { select: { products: { where: { deletedAt: null } } } } }
}> & { productCount: number }

export interface SupplierStats {
    total: number
    active: number
    inactive: number
    totalProducts: number
}

export async function getSupplierStats(): Promise<SupplierStats> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const [total, active, inactive, totalProducts] = await Promise.all([
        db.supplier.count(),
        db.supplier.count({ where: { isActive: true } }),
        db.supplier.count({ where: { isActive: false } }),
        db.product.count({
            where: { supplierId: { not: null }, deletedAt: null },
        }),
    ])

    return { total, active, inactive, totalProducts }
}

export async function getSuppliers(): Promise<SupplierWithMapped[]>
export async function getSuppliers(params: PaginationParams): Promise<PaginatedResult<SupplierWithMapped>>
export async function getSuppliers(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)

    if (!pagination) {
        const suppliers = await db.supplier.findMany({
            where: {},
            take: 100,
            include: { _count: { select: { products: { where: { deletedAt: null } } } } },
            orderBy: { createdAt: "desc" },
        })
        return suppliers.map(mapSupplier)
    }

    const [suppliers, total] = await Promise.all([
        db.supplier.findMany({
            ...pagination,
            where: {},
            include: { _count: { select: { products: { where: { deletedAt: null } } } } },
            orderBy: { createdAt: "desc" },
        }),
        db.supplier.count({ where: {} }),
    ])

    return createPaginatedResult(
        suppliers.map(mapSupplier),
        total,
        params
    )
}

function mapSupplier(s: { _count: { products: number } }) {
    return { ...s, productCount: s._count.products }
}

export async function getSupplier(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.supplier.findFirst({
        where: { id },
        include: { products: { where: {} } },
    })
}

export const createSupplier = validatedActionWithRole(
    "MANAGER",
    supplierSchema,
    ENTITY_TYPE.SUPPLIER,
    PATHS.SUPPLIERS,
    async (ctx) => {
        const supplier = await ctx.db.supplier.create({
            data: {
                ...ctx.parsed,
                email: ctx.parsed.email ?? null,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.SupplierUncheckedCreateInput,
        })
        return supplier
    },
    (parsed) => `Created supplier: ${parsed.name}`
)

export const updateSupplier = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }).and(supplierSchema),
    ENTITY_TYPE.SUPPLIER,
    PATHS.SUPPLIERS,
    async (ctx) => {
        const { id, ...data } = ctx.parsed
        const result = await ctx.db.supplier.updateMany({
            where: { id },
            data: {
                ...data,
                email: data.email ?? null,
            },
        })
        if (result.count === 0) {
            throw new NotFoundError("Supplier")
        }
        return { id }
    },
    (parsed) => `Updated supplier: ${parsed.id}`,
    "UPDATE"
)

export const deleteSupplier = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.SUPPLIER,
    PATHS.SUPPLIERS,
    async (ctx) => {
        const result = await ctx.db.supplier.updateMany({
            where: { id: ctx.parsed.id },
            data: { deletedAt: new Date() },
        })
        if (result.count === 0) {
            throw new NotFoundError("Supplier")
        }
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted supplier: ${parsed.id}`,
    "DELETE"
)
