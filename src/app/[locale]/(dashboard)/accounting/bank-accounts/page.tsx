import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Landmark, CreditCard, Wallet, Building2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { BankAccountsTable } from "@/components/finance/bank-accounts-table"
import {
    type BankAccountRow,
} from "@/components/finance/bank-account-columns"
import { getBankAccounts } from "@/lib/actions/bank-accounts"
import { formatCurrency } from "@/lib/utils"

export default async function AccountingBankAccountsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()

    const accountsData = await getBankAccounts()

    const accounts: BankAccountRow[] = accountsData.map(acc => ({
        id: acc.id,
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        iban: acc.iban,
        accountType: acc.accountType,
        currency: acc.currency,
        balance: acc.balance,
        isActive: acc.isActive
    }))

    const totalBalanceTRY = accounts
        .filter(a => a.currency === "TRY" && a.isActive)
        .reduce((sum, a) => sum + a.balance, 0)

    const totalBalanceUSD = accounts
        .filter(a => a.currency === "USD" && a.isActive)
        .reduce((sum, a) => sum + a.balance, 0)

    const totalBalanceEUR = accounts
        .filter(a => a.currency === "EUR" && a.isActive)
        .reduce((sum, a) => sum + a.balance, 0)

    const activeAccounts = accounts.filter(a => a.isActive).length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{t("accounting.bankAccounts.activeAccounts", { count: activeAccounts })}</span>
                    </div>
                    <RoleGate allow="MANAGER">
                    <Button asChild>
                        <Link href="/accounting/bank-accounts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("accounting.bankAccounts.addAccount")}
                        </Link>
                    </Button>
                    </RoleGate>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.bankAccounts.tryBalance")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalBalanceTRY, "TRY")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.bankAccounts.usdBalance")}</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(totalBalanceUSD, "USD")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.bankAccounts.eurBalance")}</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(totalBalanceEUR, "EUR")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <BankAccountsTable data={accounts} />
            </div>
        </div>
    )
}
