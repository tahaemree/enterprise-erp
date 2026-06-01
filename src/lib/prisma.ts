import { PrismaClient } from "@prisma/client"
import { LRUCache } from "lru-cache"
import { encrypt, decrypt } from "@/lib/encryption"
import { AuditTrailError } from "@/lib/errors"
import { withAuditLog } from "@/lib/prisma-extensions/audit-log"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma

// ─── LRU Cache for Tenant-Extended Prisma Clients ─────────────────────────

/**
 * Caches tenant-scoped Prisma client extensions in an LRU cache.
 * Without this cache, every `getTenantPrisma(tenantId)` call creates a new
 * extended client via `$extends()`, which leaks memory and connections.
 *
 * - Max 100 entries (covers ~100 tenants in active use)
 * - TTL: 5 minutes — stale entries are evicted automatically
 * - Keys: tenantId strings
 * - Values: the extended Prisma client
 *
 * The cache is shared across all concurrent requests and is safe to use
 * in serverless/edge environments because Prisma extensions are stateless.
 */
const tenantPrismaCache = new LRUCache<string, ReturnType<typeof createTenantPrisma>>({
    max: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
})

/**
 * Models that have a `deletedAt` field for soft delete support.
 */
const SOFT_DELETE_MODELS = new Set([
    "Product",
    "Category",
    "Supplier",
    "Customer",
    "Order",
    "Transaction",
    "Employee",
    "Department",
    "LeaveRequest",
    "CostCenter",
    "BankAccount",
    "CheckPromissoryNote",
    "CustomerAccount",
    "SupplierAccount",
    "AccountEntry",
    "EInvoice",
    "BaBsForm",
    "Currency",
    "TaxType",
])

/**
 * Operations where soft-delete filtering should be applied.
 * We skip aggregate operations because they use their own filtering.
 */
const READ_OPERATIONS = new Set([
    "findMany",
    "findFirst",
    "findFirstOrThrow",
    "findUnique",
    "findUniqueOrThrow",
    "count",
])

// ─── KVKK Encryption & Tenant Isolation Extension ───────────────────────────

/**
 * Models that are NOT tenant-scoped (Auth.js system models)
 */
/**
 * Models that are NOT tenant-scoped (Auth.js system models, relation-only models).
 *
 * Relation-only models (OrderItem, AccountEntryLine, BaBsFormItem) don't have
 * a direct tenantId field — they are always accessed through their parent
 * entity (Order, AccountEntry, BaBsForm), which IS tenant-scoped.
 */
const NON_TENANT_MODELS = new Set([
    "VerificationToken",
    "Account",
    "Session",
    "Tenant",
    "OrderItem",
    "AccountEntryLine",
    "BaBsFormItem",
])

/**
 * KVKK fields that require encryption
 */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
    Tenant: ["taxId"],
    Employee: ["bankAccount", "iban", "taxId"],
    Customer: ["taxId"],
    Supplier: ["taxId", "bankAccount", "iban"],
    CheckPromissoryNote: ["issuerTaxId"],
    BankAccount: ["iban"],
}

/**
 * Creates the Prisma client extension for a specific tenant.
 * Encapsulated in a function so the LRU cache can create new instances on miss.
 */
function createTenantPrisma(tenantId: string) {
    return basePrisma.$extends(withAuditLog).$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query, model, operation }) {
                    // Skip tenant checks for non-tenant models
                    const isTenantModel = !NON_TENANT_MODELS.has(model)
                    const encryptedFields = ENCRYPTED_FIELDS[model]
                    const isSoftDeletable = SOFT_DELETE_MODELS.has(model)

                    // ─── 0. Audit Trail Immutability ───────────────────────────
                    if (model === "ActivityLog" && ["update", "updateMany", "delete", "deleteMany", "upsert"].includes(operation)) {
                        throw new AuditTrailError("ActivityLog records cannot be modified or deleted")
                    }

                    // ─── 1. KVKK Encryption (Input) ────────────────────────────
                    if (encryptedFields && ["create", "update", "createMany", "updateMany", "upsert"].includes(operation)) {
                        if ("data" in args && args.data != null) {
                            const data = args.data as Record<string, any>
                            if (Array.isArray(data)) {
                                args.data = data.map(item => {
                                    const newItem = { ...item }
                                    for (const field of encryptedFields) {
                                        if (newItem[field]) newItem[field] = encrypt(newItem[field])
                                    }
                                    return newItem
                                })
                            } else {
                                for (const field of encryptedFields) {
                                    if (data[field]) data[field] = encrypt(data[field])
                                }
                            }
                        }
                        if ("create" in args && args.create != null && !Array.isArray(args.create)) {
                            const createData = args.create as Record<string, any>
                            for (const field of encryptedFields) {
                                if (createData[field]) createData[field] = encrypt(createData[field])
                            }
                        }
                        if ("update" in args && args.update != null && !Array.isArray(args.update)) {
                            const updateData = args.update as Record<string, any>
                            for (const field of encryptedFields) {
                                if (updateData[field]) updateData[field] = encrypt(updateData[field])
                            }
                        }
                    }

                    // ─── 2. Soft Delete Filtering (exclude deleted records) ────
                    // Automatically inject `deletedAt: null` into read queries
                    // for models that support soft delete, unless the query
                    // explicitly includes a `deletedAt` condition (to allow
                    // admin queries that include deleted records).
                    if (isSoftDeletable && READ_OPERATIONS.has(operation)) {
                        const where = ("where" in args && args.where != null)
                            ? args.where as Record<string, any>
                            : {} as Record<string, any>
                        // Only inject if the query doesn't already filter by deletedAt
                        // Note: This allows explicit queries like { deletedAt: { not: null } } to bypass
                        // the automatic filter for admin panels that need to view deleted records.
                        if (!("deletedAt" in where)) {
                            where.deletedAt = null
                        }
                        Object.assign(args, { where })
                    }

                    // ─── 3. Tenant Isolation ──────────────────────────────────

                    if (isTenantModel) {
                        if ("where" in args) {
                            const where = args.where ?? {}
                                // SECURITY: ALWAYS override tenantId to prevent Tenant Isolation Bypass
                                // For findUnique/findUniqueOrThrow, Prisma 6.x accepts additional non-unique
                                // fields in the where clause and generates the correct SQL internally.
                                ; (where as Record<string, any>).tenantId = tenantId
                            args.where = where
                        }

                        // DATA injection for creates
                        if ("data" in args && args.data != null) {
                            const data = args.data
                            if (Array.isArray(data)) {
                                args.data = data.map((item: Record<string, any>) => ({
                                    ...item,
                                    tenantId: item.tenantId ?? tenantId,
                                }))
                            } else if (typeof data === "object") {
                                ; (args.data as Record<string, any>).tenantId =
                                    (data as Record<string, any>).tenantId ?? tenantId
                            }
                        }

                        // UPSERT handling
                        if ("create" in args && typeof args.create === "object" && args.create != null && !Array.isArray(args.create)) {
                            ; (args.create as Record<string, any>).tenantId =
                                (args.create as Record<string, any>).tenantId ?? tenantId
                        }
                    }

                    // ─── EXECUTE QUERY WITH RLS (Row Level Security) ───────────
                    // Force the query into a transaction to set the session variable securely
                    let result;
                    if (isTenantModel) {
                        const [, queryResult] = await basePrisma.$transaction([
                            basePrisma.$executeRawUnsafe(
                                `SELECT set_config('app.current_tenant_id', $1, true)`,
                                tenantId
                            ),
                            query(args),
                        ])
                        result = queryResult
                    } else {
                        result = await query(args)
                    }

                    // ─── 4. Defense-in-Depth: Tenant Isolation Post-Check (fallback) ─
                    // This catches any edge case where the injection above didn't apply
                    // (e.g., findUnique on a Prisma version that doesn't support extra fields)
                    const isUniqueQuery = operation === "findUnique" || operation === "findUniqueOrThrow"
                    if (isTenantModel && isUniqueQuery && result) {
                        const resObj = result as Record<string, any>
                        if (resObj.tenantId && resObj.tenantId !== tenantId) {
                            if (operation === "findUniqueOrThrow") {
                                const error = Object.assign(
                                    new Error("Record not found or access denied"),
                                    { code: PrismaErrorCode.RECORD_NOT_FOUND }
                                )
                                throw error
                            }
                            return null
                        }
                    }

                    // ─── 5. KVKK Decryption (Output) ───────────────────────────
                    if (encryptedFields && result) {
                        if (Array.isArray(result)) {
                            for (const item of result) {
                                if (item) {
                                    const record = item as Record<string, any>
                                    for (const field of encryptedFields) {
                                        if (record[field]) record[field] = decrypt(record[field])
                                    }
                                }
                            }
                        } else {
                            const record = result as Record<string, any>
                            for (const field of encryptedFields) {
                                if (record[field]) record[field] = decrypt(record[field])
                            }
                        }
                    }

                    return result
                },
            },
        },
    })
}

export type TenantPrismaClient = ReturnType<typeof createTenantPrisma>

/**
 * Returns a tenant-scoped Prisma client with:
 * 1. Automatic tenantId injection (SECURITY: always overrides)
 * 2. KVKK encryption/decryption for sensitive fields
 * 3. Soft delete filtering (excludes deleted records by default)
 * 4. Post-query tenant isolation check for findUnique
 *
 * The client is cached per tenantId via LRU cache for performance.
 *
 * @param tenantId - The tenant ID to scope queries to
 * @returns Extended Prisma client with tenant isolation
 */
export function getTenantPrisma(tenantId: string) {
    const cached = tenantPrismaCache.get(tenantId)
    if (cached) return cached

    const client = createTenantPrisma(tenantId)
    tenantPrismaCache.set(tenantId, client)
    return client
}

/**
 * Clears the tenant Prisma cache. Useful for testing or after tenant configuration changes.
 */
export function clearTenantPrismaCache(): void {
    tenantPrismaCache.clear()
}

// Ensure the default prisma instance used in standard auth/jobs has the same base setup
/**
 * Base Prisma instance for non-tenant contexts (auth, rate limiting, etc.)
 * Wrapped with proper typing — no `as any` needed.
 */
export const prisma = basePrisma

// ─── Prisma Error Codes ────────────────────────────────────────────────────

export const PrismaErrorCode = {
    UNIQUE_CONSTRAINT: "P2002",
    FOREIGN_KEY_FAILED: "P2003",
    RECORD_NOT_FOUND: "P2025",
    CONSTRAINT_FAILED: "P2004",
    DATABASE_CONNECTION: "P1001",
} as const

export function isUniqueConstraintError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === PrismaErrorCode.UNIQUE_CONSTRAINT
    )
}
