import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Landmark, CreditCard, Wallet } from "lucide-react"
import { getTranslations, getFormatter } from "next-intl/server"
import { Button } from "@/components/ui/button"
import type { BankAccountRow } from "@/components/finance/bank-account-columns"
import { BankAccountsTable } from "@/components/finance/bank-accounts-table"
import { getBankAccounts } from "@/lib/actions/bank-accounts"

export default async function BankAccountsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    // Proje genelinde translations kullanılıyor, ancak eksik olabilir, varsayılan bir proxy kullanabiliriz.
    // Şimdilik globalT ile sarmalıyoruz.
    const globalT = await getTranslations()
    const format = await getFormatter()

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
    
    // Yabancı kurların TRY çevirimi ideal olarak FinanceService'deki exchangeRate ile yapılır.
    // MVP için sadece TRY, USD, EUR toplamları ayrı ayrı gösterilebilir.
    const totalBalanceUSD = accounts
        .filter(a => a.currency === "USD" && a.isActive)
        .reduce((sum, a) => sum + a.balance, 0)
        
    const totalBalanceEUR = accounts
        .filter(a => a.currency === "EUR" && a.isActive)
        .reduce((sum, a) => sum + a.balance, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {globalT("finance.bankAccounts.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {globalT("finance.bankAccounts.description")}
                    </p>
                </div>
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/finance/bank-accounts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {globalT("finance.bankAccounts.addAccount")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {globalT("finance.bankAccounts.tryBalance")}
                        </span>
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
                        {format.number(totalBalanceTRY, { style: "currency", currency: "TRY" })}
                    </p>
                </div>
                
                <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {globalT("finance.bankAccounts.usdBalance")}
                        </span>
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-blue-700 dark:text-blue-400">
                        {format.number(totalBalanceUSD, { style: "currency", currency: "USD" })}
                    </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {globalT("finance.bankAccounts.eurBalance")}
                        </span>
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-purple-700 dark:text-purple-400">
                        {format.number(totalBalanceEUR, { style: "currency", currency: "EUR" })}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4">
                <BankAccountsTable data={accounts} />
            </div>
        </div>
    )
}
