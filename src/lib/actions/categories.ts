"use server"

import { requireAuth } from "@/lib/auth-utils"
import { categorySchema } from "@/lib/validations/inventory"
import type { Prisma } from "@prisma/client"
import { NotFoundError } from "@/lib/errors"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { getTenantPrisma } from "@/lib/prisma"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"
import { z } from "zod"

type CategoryWithMapped = Prisma.CategoryGetPayload<{
    include: { _count: { select: { products: true } } }
}> & { productCount: number }

export async function getCategories(): Promise<CategoryWithMapped[]>
export async function getCategories(params: PaginationParams): Promise<PaginatedResult<CategoryWithMapped>>
export async function getCategories(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const pagination = getPaginationArgs(params)
    const query = {
        where: {},
        include: {
            _count: { select: { products: { where: { deletedAt: null } } } },
        },
        orderBy: { name: "asc" as const },
    }

    if (!pagination) {
        const categories = await db.category.findMany({ ...query, take: 100 })
        return categories.map(mapCategory)
    }

    const [categories, total] = await Promise.all([
        db.category.findMany({ ...pagination, ...query }),
        db.category.count({ where: {} }),
    ])

    return createPaginatedResult(categories.map(mapCategory), total, params)
}

function mapCategory(c: { _count: { products: number } }) {
    return { ...c, productCount: c._count.products }
}

export async function getCategory(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    return db.category.findFirst({
        where: { id },
        include: { products: { where: {} } },
    })
}

function createSlug(name: string): string {
    const base = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 6)
    return `${base}-${suffix}`
}

/**
 * Creates a new category.
 * Uses validatedAction for consistent auth, validation, logging, activity logging, and revalidation.
 */
export const createCategory = validatedActionWithRole(
    "MANAGER",
    categorySchema,
    ENTITY_TYPE.CATEGORY,
    PATHS.CATEGORIES,
    async (ctx) => {
        const slug = createSlug(ctx.parsed.name)
        const category = await ctx.db.category.create({
            data: {
                ...ctx.parsed,
                slug,
                tenantId: ctx.user.tenantId,
            } satisfies Prisma.CategoryUncheckedCreateInput,
        })
        return category
    },
    (parsed) => `Created category: ${parsed.name}`
)

export const updateCategory = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }).and(categorySchema),
    ENTITY_TYPE.CATEGORY,
    PATHS.CATEGORIES,
    async (ctx) => {
        const { id, ...data } = ctx.parsed
        const result = await ctx.db.category.updateMany({
            where: { id },
            data,
        })
        if (result.count === 0) {
            throw new NotFoundError("Category")
        }
        return { id }
    },
    (parsed) => `Updated category: ${parsed.id}`,
    "UPDATE"
)

export const deleteCategory = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.CATEGORY,
    PATHS.CATEGORIES,
    async (ctx) => {
        const result = await ctx.db.category.updateMany({
            where: { id: ctx.parsed.id },
            data: { deletedAt: new Date() },
        })
        if (result.count === 0) {
            throw new NotFoundError("Category")
        }
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted category: ${parsed.id}`,
    "DELETE"
)
