/**
 * SEC-1 backfill: migrate existing plaintext Tenant.apiKey values to the
 * prefix + SHA-256 hash storage model.
 *
 * Safe to run multiple times (idempotent): tenants that already have an
 * apiKeyHash are skipped. Existing integrations keep working because their
 * token is unchanged — only how we STORE it changes.
 *
 * Run AFTER `prisma migrate deploy`:
 *   npx tsx scripts/backfill-api-keys.ts
 *
 * Once verified, drop the legacy plaintext column in a follow-up migration.
 */
import { PrismaClient } from "@prisma/client"
import { getApiKeyPrefix, hashApiKey } from "../src/lib/api-key"

const prisma = new PrismaClient()

async function main() {
    const tenants = await prisma.tenant.findMany({
        where: { apiKey: { not: null }, apiKeyHash: null },
        select: { id: true, apiKey: true },
    })

    if (tenants.length === 0) {
        console.log("No tenants require API-key backfill. ✅")
        return
    }

    let migrated = 0
    for (const tenant of tenants) {
        if (!tenant.apiKey) continue
        await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
                apiKeyPrefix: getApiKeyPrefix(tenant.apiKey),
                apiKeyHash: hashApiKey(tenant.apiKey),
            },
        })
        migrated++
    }

    console.log(`Backfilled ${migrated} tenant API key(s). ✅`)
    console.log(
        "Next: verify integrations, then drop the legacy \"apiKey\" column in a follow-up migration.",
    )
}

main()
    .catch((err) => {
        console.error("Backfill failed:", err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
