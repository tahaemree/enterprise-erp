/*
  Warnings:

  - Added the required column `updatedAt` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "AccountEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "BaBsForm" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CheckPromissoryNote" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CostCenter" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Currency" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CustomerAccount" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EInvoice" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SupplierAccount" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TaxType" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT 'bg-blue-500',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimit_key_idx" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_key_windowStart_idx" ON "RateLimit"("key", "windowStart");

-- CreateIndex
CREATE INDEX "RateLimit_tenantId_idx" ON "RateLimit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_windowStart_key" ON "RateLimit"("key", "windowStart");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_userId_isRead_idx" ON "Notification"("tenantId", "userId", "isRead");

-- CreateIndex
CREATE INDEX "AccountEntry_tenantId_entryDate_idx" ON "AccountEntry"("tenantId", "entryDate");

-- CreateIndex
CREATE INDEX "AccountEntry_tenantId_deletedAt_idx" ON "AccountEntry"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "BaBsForm_tenantId_year_month_idx" ON "BaBsForm"("tenantId", "year", "month");

-- CreateIndex
CREATE INDEX "BaBsForm_tenantId_deletedAt_idx" ON "BaBsForm"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_isActive_idx" ON "BankAccount"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_deletedAt_idx" ON "BankAccount"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Category_tenantId_deletedAt_idx" ON "Category"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CheckPromissoryNote_tenantId_status_maturityDate_idx" ON "CheckPromissoryNote"("tenantId", "status", "maturityDate");

-- CreateIndex
CREATE INDEX "CheckPromissoryNote_tenantId_deletedAt_idx" ON "CheckPromissoryNote"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CostCenter_tenantId_isActive_idx" ON "CostCenter"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CostCenter_tenantId_deletedAt_idx" ON "CostCenter"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Currency_tenantId_deletedAt_idx" ON "Currency"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_fromCurrencyId_date_idx" ON "CurrencyExchangeRate"("fromCurrencyId", "date");

-- CreateIndex
CREATE INDEX "CurrencyExchangeRate_source_idx" ON "CurrencyExchangeRate"("source");

-- CreateIndex
CREATE INDEX "Customer_tenantId_source_idx" ON "Customer"("tenantId", "source");

-- CreateIndex
CREATE INDEX "Customer_tenantId_deletedAt_idx" ON "Customer"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CustomerAccount_tenantId_isActive_idx" ON "CustomerAccount"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerAccount_tenantId_deletedAt_idx" ON "CustomerAccount"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Department_tenantId_deletedAt_idx" ON "Department"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "EInvoice_tenantId_issueDate_idx" ON "EInvoice"("tenantId", "issueDate");

-- CreateIndex
CREATE INDEX "EInvoice_tenantId_deletedAt_idx" ON "EInvoice"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Employee_tenantId_departmentId_idx" ON "Employee"("tenantId", "departmentId");

-- CreateIndex
CREATE INDEX "Employee_tenantId_deletedAt_idx" ON "Employee"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_status_idx" ON "LeaveRequest"("employeeId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_tenantId_deletedAt_idx" ON "LeaveRequest"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_deletedAt_idx" ON "Order"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Product_tenantId_deletedAt_idx" ON "Product"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_isActive_idx" ON "Supplier"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_deletedAt_idx" ON "Supplier"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "SupplierAccount_tenantId_isActive_idx" ON "SupplierAccount"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "SupplierAccount_tenantId_deletedAt_idx" ON "SupplierAccount"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "TaxType_tenantId_deletedAt_idx" ON "TaxType"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Tenant_plan_idx" ON "Tenant"("plan");

-- CreateIndex
CREATE INDEX "Tenant_isActive_plan_idx" ON "Tenant"("isActive", "plan");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_category_idx" ON "Transaction"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_deletedAt_idx" ON "Transaction"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "RateLimit" ADD CONSTRAINT "RateLimit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
