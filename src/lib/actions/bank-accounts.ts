"use server"

import { requireAuth, requireManager } from "@/lib/auth-utils"
import { BankAccountService } from "@/services/bank-account.service"
import { bankAccountSchema, type BankAccountFormValues } from "@/lib/validations/finance"
import { revalidatePath } from "next/cache"
import logger from "@/lib/logger"
import { executeAction, type ActionResult, fromZodError } from "@/lib/errors"
import { activityLogService } from "@/services/activity-log.service"
import type { Prisma } from "@prisma/client"
import { ENTITY_TYPE, PATHS } from "@/lib/constants"

type BankAccountResult = Prisma.BankAccountGetPayload<Record<string, never>>

export async function getBankAccounts() {
    const user = await requireAuth()
    return BankAccountService.getBankAccounts(user.tenantId)
}

export async function getBankAccount(id: string) {
    const user = await requireAuth()
    return BankAccountService.getBankAccountById(user.tenantId, id)
}

export async function createBankAccount(data: BankAccountFormValues): Promise<ActionResult<BankAccountResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        
        const parsed = bankAccountSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const account = await BankAccountService.createBankAccount(user.tenantId, parsed.data)
        logger.info(`Bank account created: ${account.id} by user ${user.id}`)
        await activityLogService.log(user.id, user.tenantId, {
            action: "CREATE",
            entityType: ENTITY_TYPE.BANK_ACCOUNT,
            entityId: account.id,
            description: `Created bank account: ${account.bankName} (${account.accountNumber?.slice(-4)})`,
        })
        revalidatePath(PATHS.BANK_ACCOUNTS)
        return account as BankAccountResult
    })
}

export async function updateBankAccount(id: string, data: BankAccountFormValues): Promise<ActionResult<BankAccountResult>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        
        const parsed = bankAccountSchema.safeParse(data)
        if (!parsed.success) throw fromZodError(parsed.error)

        const account = await BankAccountService.updateBankAccount(user.tenantId, id, parsed.data)
        logger.info(`Bank account updated: ${account.id} by user ${user.id}`)
        await activityLogService.log(user.id, user.tenantId, {
            action: "UPDATE",
            entityType: ENTITY_TYPE.BANK_ACCOUNT,
            entityId: account.id,
            description: `Updated bank account: ${account.bankName} (${account.accountNumber?.slice(-4)})`,
        })
        revalidatePath(PATHS.BANK_ACCOUNTS)
        return account as BankAccountResult
    })
}

export async function deleteBankAccount(id: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        const user = await requireAuth()
        requireManager(user)
        await BankAccountService.deleteBankAccount(user.tenantId, id)
        logger.info(`Bank account deleted: ${id} by user ${user.id}`)
        await activityLogService.log(user.id, user.tenantId, {
            action: "DELETE",
            entityType: ENTITY_TYPE.BANK_ACCOUNT,
            entityId: id,
            description: `Deleted bank account: ${id}`,
        })
        revalidatePath(PATHS.BANK_ACCOUNTS)
    })
}
