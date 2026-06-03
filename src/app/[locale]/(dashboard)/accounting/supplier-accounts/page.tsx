import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Wallet, AlertTriangle, CheckCircle, Building2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { SupplierAccountsTable } from "@/components/accounting/supplier-accounts-table"
import { type SupplierAccount } from "@/components/accounting/supplier-account-columns"
import { formatCurrency } from "@/lib/utils"
import { getSupplierAccounts } from "@/lib/actions/tr-accounting"

export default async function SupplierAccountsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.supplierAccounts")
    const accountsData = await getSupplierAccounts()

    const accounts: SupplierAccount[] = accountsData.map((a) => ({
        id: a.id,
        accountCode: a.accountCode,
        supplier: {
            id: a.supplier.id,
            name: a.supplier.name,
            contactName: a.supplier.contactName,
            email: a.supplier.email,
        },
        currentBalance: a.currentBalance,
        overdueBalance: a.overdueBalance,
        riskLimit: a.riskLimit,
        paymentTerms: a.paymentTerms,
        notes: a.notes,
        createdAt: a.createdAt,
    }))

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0)
    const totalOverdue = accounts.reduce((sum, a) => sum + a.overdueBalance, 0)
    const atRiskAccounts = accounts.filter((a) => a.overdueBalance > 0).length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/accounting/supplier-accounts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addAccount")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalAccounts")}</p>
                            <p className="text-2xl font-bold">{accounts.length}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalBalance")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalBalance)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("overdueBalance")}</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(totalOverdue)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("atRisk")}</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atRiskAccounts}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <SupplierAccountsTable data={accounts} />
            </div>
        </div>
    )
}
