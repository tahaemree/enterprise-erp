import { getTranslations } from "next-intl/server"
import { BankAccountForm } from "@/components/finance/bank-account-form"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"

export default async function NewBankAccountPage(props: { searchParams: Promise<{ edit?: string }> }) {
    const searchParams = await props.searchParams;
    const t = await getTranslations("bankAccounts")
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    let initialData = undefined
    if (searchParams.edit) {
        const account = await db.bankAccount.findUnique({
            where: { id: searchParams.edit }
        })
        if (!account) notFound()
        initialData = {
            id: account.id,
            bankName: account.bankName,
            branchName: account.branchName || "",
            branchCode: account.branchCode || "",
            accountNumber: account.accountNumber,
            iban: account.iban,
            accountType: account.accountType,
            currency: account.currency,
            description: account.description || "",
            isActive: account.isActive
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {searchParams.edit ? t("editTitle", { fallback: "Edit Bank Account" }) : t("addAccount", { fallback: "Add Bank Account" })}
                </h1>
                <p className="text-muted-foreground">
                    {searchParams.edit ? t("editDesc", { fallback: "Update bank account details." }) : t("addAccountDesc", { fallback: "Create a new bank account. IBAN details will be encrypted securely (KVKK compliant)." })}
                </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
                <BankAccountForm initialData={initialData} />
            </div>
        </div>
    )
}
