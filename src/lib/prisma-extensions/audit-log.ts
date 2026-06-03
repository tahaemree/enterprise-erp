import { Prisma } from "@prisma/client"
import { headers } from "next/headers"

type MutableRecord = Record<string, unknown>

type FindUniqueDelegate = {
    findUnique(args: { where: unknown }): Promise<unknown>
}

type AuditLogCreateDelegate = {
    create(args: {
        data: {
            tenantId: string
            action: string
            entity: string
            entityId: string
            oldData: Prisma.InputJsonValue | null
            newData: Prisma.InputJsonValue | null
            userId: string | null
            ipAddress: string
            userAgent: string
        }
    }): Promise<unknown>
}

function asMutableRecord(value: unknown): MutableRecord | null {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as MutableRecord
        : null
}

function hasFindUnique(value: unknown): value is FindUniqueDelegate {
    return asMutableRecord(value)?.findUnique instanceof Function
}

function hasAuditLogCreate(value: unknown): value is { auditLog: AuditLogCreateDelegate } {
    const record = asMutableRecord(value)
    const auditLog = asMutableRecord(record?.auditLog)
    return auditLog?.create instanceof Function
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value == null) return null
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

/**
 * Creates an Audit Log extension for Prisma.
 * This captures all mutations (create, update, delete) and saves the delta (old vs new)
 * to the AuditLog table for enterprise-grade immutable tracking.
 */
export const withAuditLog = Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Skip if it's the AuditLog itself or ActivityLog or non-tenant auth models
                    const skipModels = ["AuditLog", "ActivityLog", "Session", "Account", "VerificationToken", "Tenant"]
                    if (skipModels.includes(model)) {
                        return query(args)
                    }

                    // Only intercept mutations
                    const isMutation = ["create", "update", "delete", "upsert"].includes(operation)
                    if (!isMutation) {
                        return query(args)
                    }

                    let oldData: MutableRecord | null = null
                    const argsRecord = asMutableRecord(args)
                    
                    // Attempt to fetch old data before update or delete
                    if (operation === "update" || operation === "delete") {
                        try {
                            if (argsRecord?.where) {
                                const modelDelegate = (client as Record<string, unknown>)[model]
                                if (hasFindUnique(modelDelegate)) {
                                    oldData = asMutableRecord(await modelDelegate.findUnique({
                                        where: argsRecord.where
                                    }))
                                }
                            }
                        } catch (_error) {
                            // Ignore fetch errors, just proceed without oldData
                        }
                    }

                    // Execute the actual mutation
                    const result = await query(args)

                    // Determine New Data
                    let newData = null
                    if (operation === "create" || operation === "update" || operation === "upsert") {
                        newData = result
                    }

                    // Attempt to extract userId/tenantId from result or args
                    const resultRecord = asMutableRecord(result)
                    const dataRecord = asMutableRecord(argsRecord?.data)
                    const tenantId = resultRecord?.tenantId || dataRecord?.tenantId || oldData?.tenantId
                    const userId = dataRecord?.userId || dataRecord?.updatedBy || null
                    const entityId = resultRecord?.id || oldData?.id || "unknown"

                    // If we have a tenantId, we can save the audit log
                    if (typeof tenantId === "string" && hasAuditLogCreate(client)) {
                        try {
                            // Best-effort to get IP Address if in Next.js Server Context
                            let ipAddress = "unknown"
                            let userAgent = "unknown"
                            try {
                                const h = await headers()
                                ipAddress = h.get("x-forwarded-for") || "unknown"
                                userAgent = h.get("user-agent") || "unknown"
                            } catch (_e) {
                                // Ignore headers error (might not be in request context, e.g. cron job)
                            }

                            // Fire and forget the audit log creation
                            Promise.resolve(client.auditLog.create({
                                data: {
                                    tenantId,
                                    action: operation.toUpperCase(),
                                    entity: model,
                                    entityId: String(entityId),
                                    oldData: toJsonValue(oldData),
                                    newData: toJsonValue(newData),
                                    userId: typeof userId === "string" ? userId : null,
                                    ipAddress,
                                    userAgent
                                }
                            })).catch((err) => {
                                console.error("[AuditLog Error]", err)
                            })
                        } catch (e) {
                            console.error("Audit Logging setup failed:", e)
                        }
                    }

                    return result
                }
            }
        }
    })
})
