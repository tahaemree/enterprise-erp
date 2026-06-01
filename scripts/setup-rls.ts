import { PrismaClient } from "@prisma/client"
import logger from "../src/lib/logger"

const prisma = new PrismaClient()

async function setupRLS() {
    logger.info("Setting up Row Level Security (RLS)...")

    const tenantModels = ["Order", "Product", "Customer", "Transaction", "Employee", "ActivityLog"]

    try {
        for (const model of tenantModels) {
            // Enable RLS on the table
            await prisma.$executeRawUnsafe(`ALTER TABLE "${model}" ENABLE ROW LEVEL SECURITY;`)
            
            // Drop existing policy if any
            await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${model}";`)
            
            // Create the policy
            // Policy allows access only if the row's tenantId matches the current transaction's app.current_tenant_id
            await prisma.$executeRawUnsafe(`
                CREATE POLICY tenant_isolation_policy ON "${model}"
                FOR ALL
                USING ("tenantId" = current_setting('app.current_tenant_id', true));
            `)
            
            logger.info(`✅ RLS enabled for ${model}`)
        }

        // Note: For Prisma's default user (usually a superuser like postgres), RLS might be bypassed.
        // In a production setup, we either need a separate non-superuser for the app, 
        // OR force RLS on the superuser using FORCE ROW LEVEL SECURITY.
        for (const model of tenantModels) {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${model}" FORCE ROW LEVEL SECURITY;`)
        }
        
        logger.info("🎉 RLS Setup Complete. System is now fully isolated at the DB level.")
    } catch (error) {
        logger.error("Error setting up RLS", { error })
    } finally {
        await prisma.$disconnect()
    }
}

setupRLS()
