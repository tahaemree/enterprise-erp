import { Prisma } from "@prisma/client"
import { headers } from "next/headers"

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

                    let oldData = null
                    
                    // Attempt to fetch old data before update or delete
                    if (operation === "update" || operation === "delete") {
                        try {
                            if ((args as any).where) {
                                oldData = await (client as any)[model].findUnique({
                                    where: (args as any).where
                                })
                            }
                        } catch (error) {
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
                    const tenantId = (result as any)?.tenantId || (args as any).data?.tenantId || oldData?.tenantId
                    const userId = (args as any).data?.userId || (args as any).data?.updatedBy || null
                    const entityId = (result as any)?.id || oldData?.id || "unknown"

                    // If we have a tenantId, we can save the audit log
                    if (tenantId) {
                        try {
                            // Best-effort to get IP Address if in Next.js Server Context
                            let ipAddress = "unknown"
                            let userAgent = "unknown"
                            try {
                                const h = await headers()
                                ipAddress = h.get("x-forwarded-for") || "unknown"
                                userAgent = h.get("user-agent") || "unknown"
                            } catch (e) {
                                // Ignore headers error (might not be in request context, e.g. cron job)
                            }

                            // Fire and forget the audit log creation
                            Promise.resolve((client as any).auditLog.create({
                                data: {
                                    tenantId,
                                    action: operation.toUpperCase(),
                                    entity: model,
                                    entityId: String(entityId),
                                    oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
                                    newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
                                    userId,
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
