import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { getTranslations } from "next-intl/server"
import { Plus, Coins, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CurrenciesTable } from "@/components/accounting/currencies-table"
import { type Currency } from "@/components/accounting/currency-columns"
import { getCurrencies } from "@/lib/actions/tr-accounting"

export default async function CurrenciesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    const currencyData = await getCurrencies()
    const currencies: Currency[] = (currencyData as Array<{
        id: string; code: string; name: string; symbol: string;
        isDefault: boolean; isActive: boolean | null; createdAt: Date
    }>).map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        isDefault: c.isDefault,
        isActive: c.isActive ?? true,
        createdAt: c.createdAt,
    }))

    const defaultCurrency = currencies.find((c) => c.isDefault)
    const activeCurrencies = currencies.filter((c) => c.isActive).length

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("accounting.currencies.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("accounting.currencies.description")}
                    </p>
                </div>
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/accounting/currencies/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("accounting.currencies.newCurrency")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.currencies.totalCurrencies")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{currencies.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.currencies.active")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {activeCurrencies}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.currencies.baseCurrency")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {defaultCurrency ? defaultCurrency.code : t("accounting.currencies.noneSet")}
                    </p>
                </div>
            </div>

            <CurrenciesTable data={currencies} />
        </div>
    )
}
