-- SEC-1: Replace plaintext API key storage with prefix + SHA-256 hash.
-- Additive & backward-compatible: the legacy "apiKey" column is retained so
-- existing integrations keep working until the backfill script runs and keys
-- are rotated. Drop "apiKey" in a follow-up migration once backfill is verified.

ALTER TABLE "Tenant" ADD COLUMN "apiKeyPrefix" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "apiKeyHash" TEXT;

CREATE UNIQUE INDEX "Tenant_apiKeyPrefix_key" ON "Tenant"("apiKeyPrefix");
