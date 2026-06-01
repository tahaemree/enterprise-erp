import { getTenantPrisma } from "@/lib/prisma"
import { BankAccountFormValues } from "@/lib/validations/finance"
import { Money } from "@/lib/money"
import type { BankAccountType } from "@prisma/client"

export class BankAccountService {
    static async getBankAccounts(tenantId: string) {
        const db = getTenantPrisma(tenantId)
        const accounts = await db.bankAccount.findMany({
            orderBy: { createdAt: "desc" },
        })

        // Decrypt IBAN and Account Number for authorized viewing
        return accounts.map(account => ({
            ...account,
            iban: account.iban || "N/A",
            // Assuming we didn't encrypt accountNumber initially, but if we did we could decrypt here.
            balance: Number(account.balance)
        }))
    }

    static async getBankAccountById(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        const account = await db.bankAccount.findUnique({
            where: { id, tenantId }
        })

        if (!account) return null

        return {
            ...account,
            iban: account.iban || "",
            balance: Number(account.balance)
        }
    }

    static async createBankAccount(tenantId: string, data: BankAccountFormValues) {
        const db = getTenantPrisma(tenantId)
        
        // Şifreleme işlemi (KVKK) Prisma Middleware tarafından otomatik yapılıyor.
        const encryptedIban = data.iban

        return await db.bankAccount.create({
            data: {
                tenantId,
                bankName: data.bankName,
                branchName: data.branchName,
                branchCode: data.branchCode,
                accountNumber: data.accountNumber,
                iban: encryptedIban, // Auto-Encrypted by Prisma
                accountType: data.accountType as BankAccountType,
                currency: data.currency,
                balance: new Money(data.balance).getValue(),
                description: data.description,
                isActive: data.isActive
            }
        })
    }

    static async updateBankAccount(tenantId: string, id: string, data: BankAccountFormValues) {
        const db = getTenantPrisma(tenantId)
        
        const encryptedIban = data.iban

        return await db.bankAccount.update({
            where: { id, tenantId },
            data: {
                bankName: data.bankName,
                branchName: data.branchName,
                branchCode: data.branchCode,
                accountNumber: data.accountNumber,
                iban: encryptedIban,
                accountType: data.accountType as BankAccountType,
                currency: data.currency,
                description: data.description,
                isActive: data.isActive
                // Note: Balance update typically happens via transactions, not direct edit.
                // Depending on requirements, we can allow it or block it. 
                // For MVP, we'll exclude balance from direct edit after creation.
            }
        })
    }

    static async deleteBankAccount(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        return await db.bankAccount.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }
}
