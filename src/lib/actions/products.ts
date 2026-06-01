"use server"

import { revalidatePath, unstable_cache } from "next/cache"
import { getTenantPrisma, basePrisma, isUniqueConstraintError } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import { productSchema } from "@/lib/validations/inventory"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { validatedActionWithRole } from "@/lib/action-wrapper"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import { serializePrisma } from "@/lib/utils"
import { ENTITY_TYPE, PATHS, STOCK_STATUS } from "@/lib/constants"

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: { category: true; supplier: true } }>

export interface ProductFilterParams extends PaginationParams {
    search?: string
    categoryId?: string
    supplierId?: string
    isActive?: boolean
    stockStatus?: "all" | "low-stock" | "out-of-stock"
    sortBy?: "name" | "price" | "quantity" | "createdAt"
    sortOrder?: "asc" | "desc"
}

function buildProductWhere(params?: ProductFilterParams): Prisma.ProductWhereInput {
    if (!params) return {}

    const where: Prisma.ProductWhereInput = {}

    if (params.search) {
        const term = params.search.trim()
        where.OR = [
            { name: { contains: term, mode: "insensitive" } },
            { sku: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { barcode: { contains: term, mode: "insensitive" } },
        ]
    }

    if (params.categoryId) where.categoryId = params.categoryId
    if (params.supplierId) where.supplierId = params.supplierId
    if (params.isActive !== undefined) where.isActive = params.isActive

    if (params.stockStatus === STOCK_STATUS.LOW_STOCK) {
        where.AND = [
            { quantity: { gt: 0 } },
        ]
    } else if (params.stockStatus === STOCK_STATUS.OUT_OF_STOCK) {
        where.quantity = 0
    }

    return where
}

function buildProductOrderBy(params?: ProductFilterParams): Prisma.ProductOrderByWithRelationInput {
    const sortBy = params?.sortBy || "createdAt"
    const sortOrder = params?.sortOrder || "desc"
    return { [sortBy]: sortOrder }
}

export async function getProducts(): Promise<ProductWithRelations[]>
export async function getProducts(params: ProductFilterParams): Promise<PaginatedResult<ProductWithRelations>>
export async function getProducts(params?: ProductFilterParams): Promise<PaginatedResult<ProductWithRelations> | ProductWithRelations[]> {
    const user = await requireAuth()

    const where = buildProductWhere(params)
    const orderBy = buildProductOrderBy(params)
    const pagination = getPaginationArgs(params)

    const db = getTenantPrisma(user.tenantId)
    
    // Account for soft deletes
    const finalWhere = { ...where, deletedAt: null }

    if (!pagination) {
        const products = await db.product.findMany({
            where: finalWhere,
            orderBy,
            include: { category: true, supplier: true },
        })
        return products as ProductWithRelations[]
    }

    const [products, total] = await Promise.all([
        db.product.findMany({
            where: finalWhere,
            orderBy,
            skip: pagination.skip!,
            take: pagination.take!,
            include: { category: true, supplier: true },
        }),
        db.product.count({ where: finalWhere }),
    ])

    return createPaginatedResult(products as ProductWithRelations[], total, params)
}

export async function getProductsStats() {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    // Use efficient DB aggregation instead of loading all products into memory.
    // `count()` queries go through Prisma's tenant isolation middleware,
    // so tenantId and soft-delete filters are applied automatically.
    const [totalProducts, outOfStock] = await Promise.all([
        db.product.count(),
        db.product.count({ where: { quantity: 0 } }),
    ])

    // Low stock: quantity > 0 AND quantity <= minStock
    // Prisma's `where` can't compare two columns, so we use a raw query
    // that manually includes tenantId and deletedAt for security.
    const result = await basePrisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count
        FROM "Product"
        WHERE "tenantId" = ${user.tenantId}
          AND "deletedAt" IS NULL
          AND "quantity" > 0
          AND "quantity" <= COALESCE("minStock", 0)
    `
    const lowStock = Number(result[0]?.count ?? 0)
    const inStock = totalProducts - lowStock - outOfStock

    return {
        totalProducts,
        inStock,
        lowStock,
        outOfStock
    }
}

export async function getProduct(id: string) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const product = await db.product.findFirst({
        where: { id },
        include: { category: true, supplier: true, orderItems: { include: { order: true } } },
    })

    return serializePrisma(product)
}

export const createProduct = validatedActionWithRole(
    "MANAGER",
    productSchema,
    ENTITY_TYPE.PRODUCT,
    PATHS.PRODUCTS,
    async (ctx) => {
        try {
            return await ctx.db.product.create({
                data: {
                    ...ctx.parsed,
                    minStock: ctx.parsed.minStock ?? 10,
                    isActive: ctx.parsed.isActive ?? true,
                    tenantId: ctx.user.tenantId,
                } satisfies Prisma.ProductUncheckedCreateInput,
                include: { category: true, supplier: true },
            })
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError(`Product with SKU "${ctx.parsed.sku}" already exists`)
            }
            throw error
        }
    },
    (parsed) => `Created product: ${parsed.sku} - ${parsed.name}`
)

export const updateProduct = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }).and(productSchema),
    ENTITY_TYPE.PRODUCT,
    PATHS.PRODUCTS,
    async (ctx) => {
        const { id, ...data } = ctx.parsed
        const result = await ctx.db.product.updateMany({
            where: { id },
            data,
        })
        if (result.count === 0) {
            throw new NotFoundError("Product")
        }
        return { id }
    },
    (parsed) => `Updated product: ${parsed.sku} - ${parsed.name}`,
    "UPDATE"
)

export const deleteProduct = validatedActionWithRole(
    "MANAGER",
    z.object({ id: z.string().min(1) }),
    ENTITY_TYPE.PRODUCT,
    PATHS.PRODUCTS,
    async (ctx) => {
        const result = await ctx.db.product.updateMany({
            where: { id: ctx.parsed.id },
            data: { deletedAt: new Date() },
        })
        if (result.count === 0) {
            throw new NotFoundError("Product")
        }
        return { id: ctx.parsed.id }
    },
    (parsed) => `Deleted product: ${parsed.id}`,
    "DELETE"
)

