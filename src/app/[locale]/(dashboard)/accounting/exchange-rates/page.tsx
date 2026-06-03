import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { getTranslations } from "next-intl/server"
import { Plus, ArrowLeftRight, Calendar, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExchangeRatesTable } from "@/components/accounting/exchange-rates-table"
import { type ExchangeRate } from "@/components/accounting/exchange-rate-columns"
import { getExchangeRates } from "@/lib/actions/tr-accounting"

export default async function ExchangeRatesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    const rateData = await getExchangeRates()
    const rates: ExchangeRate[] = (rateData as Array<{
        id: string
        fromCurrency: { code: string; name: string; symbol: string }
        toCurrency: { code: string; name: string; symbol: string }
        rate: { toNumber: () => number } | number
        date: Date
        source: string | null
        createdAt: Date
    }>).map((r) => ({
        id: r.id,
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        rate: typeof r.rate === "number" ? r.rate : r.rate.toNumber(),
        date: r.date,
        source: r.source,
        createdAt: r.createdAt,
    }))

    const uniquePairs = new Set(rates.map((r) => `${r.fromCurrency.code}-${r.toCurrency.code}`))
    const uniqueDates = new Set(rates.map((r) => r.date.toISOString().split("T")[0]))
    const avgRate = rates.length > 0
        ? rates.reduce((s, r) => s + r.rate, 0) / rates.length
        : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("accounting.exchangeRates.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("accounting.exchangeRates.description")}
                    </p>
                </div>
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/accounting/exchange-rates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("accounting.exchangeRates.newRate")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.exchangeRates.totalRecords")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{rates.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.exchangeRates.pairsCovered")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {uniquePairs.size}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.exchangeRates.daysWithData")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        {uniqueDates.size}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.exchangeRates.avgRate")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {avgRate.toFixed(4)}
                    </p>
                </div>
            </div>

            <ExchangeRatesTable data={rates} />
        </div>
    )
}
