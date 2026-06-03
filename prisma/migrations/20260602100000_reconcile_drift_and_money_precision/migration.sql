-- Reconcile migration history with the live schema.
-- The original 'init' + 'soft_delete' migrations were created before several
-- schema changes that were applied via 'prisma db push' (Role & AuditLog
-- tables, User.permissions/roleId, Tenant tax fields, many indexes/FKs) and
-- therefore never recorded. Without this, a fresh 'migrate deploy' would build
-- an INCOMPLETE schema (no RBAC roles, no audit log). This migration also
-- unifies all monetary columns to DECIMAL(18,2).

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "totalSpent" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "salary" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "shippingAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "exchangeRate" SET DATA TYPE DECIMAL(14,6);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "minStock" SET DEFAULT 10,
ALTER COLUMN "minStock" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "maxStock" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "taxOffice" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "exchangeRate" SET DATA TYPE DECIMAL(14,6);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "roleId" TEXT;

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_tenantId_key" ON "Role"("name", "tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "AccountEntryLine_customerAccountId_idx" ON "AccountEntryLine"("customerAccountId");

-- CreateIndex
CREATE INDEX "AccountEntryLine_supplierAccountId_idx" ON "AccountEntryLine"("supplierAccountId");

-- CreateIndex
CREATE INDEX "AccountEntryLine_bankAccountId_idx" ON "AccountEntryLine"("bankAccountId");

-- CreateIndex
CREATE INDEX "AccountEntryLine_costCenterId_idx" ON "AccountEntryLine"("costCenterId");

-- CreateIndex
CREATE INDEX "AccountEntryLine_entryId_side_idx" ON "AccountEntryLine"("entryId", "side");

-- CreateIndex
CREATE INDEX "ActivityLog_tenantId_userId_idx" ON "ActivityLog"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ActivityLog_tenantId_entityType_action_idx" ON "ActivityLog"("tenantId", "entityType", "action");

-- CreateIndex
CREATE INDEX "BaBsFormItem_formId_taxId_idx" ON "BaBsFormItem"("formId", "taxId");

-- CreateIndex
CREATE INDEX "CheckPromissoryNote_customerId_idx" ON "CheckPromissoryNote"("customerId");

-- CreateIndex
CREATE INDEX "CheckPromissoryNote_tenantId_customerId_idx" ON "CheckPromissoryNote"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_toCurrencyId_date_idx" ON "CurrencyExchangeRate"("toCurrencyId", "date");

-- CreateIndex
CREATE INDEX "EInvoice_orderId_idx" ON "EInvoice"("orderId");

-- CreateIndex
CREATE INDEX "InflationCoefficient_tenantId_year_month_idx" ON "InflationCoefficient"("tenantId", "year", "month");

-- CreateIndex
CREATE INDEX "Interaction_customerId_date_idx" ON "Interaction"("customerId", "date");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_productId_orderId_idx" ON "OrderItem"("productId", "orderId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_productId_idx" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_apiKey_key" ON "Tenant"("apiKey");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "VerificationToken_identifier_idx" ON "VerificationToken"("identifier");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "VerificationToken"("expires");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

