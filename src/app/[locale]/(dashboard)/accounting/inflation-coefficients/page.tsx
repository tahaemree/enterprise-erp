import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { getTranslations } from "next-intl/server"
import { Plus, TrendingDown, Calculator, LineChart, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InflationCoefficientsTable } from "@/components/accounting/inflation-coefficients-table"
import { type InflationCoefficient } from "@/components/accounting/inflation-coefficient-columns"
import { getInflationCoefficients } from "@/lib/actions/tr-accounting"

export default async function InflationCoefficientsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.inflationCoefficients")
    const coefficientData = await getInflationCoefficients()
    const coefficients: InflationCoefficient[] = coefficientData.map((c) => ({
        id: c.id,
        year: c.year,
        month: c.month,
        coefficient: Number(c.coefficient),
        ppi: c.ppi ? Number(c.ppi) : null,
        source: c.source,
        notes: c.notes,
        createdAt: c.createdAt,
    }))

    const avgCoefficient = coefficients.length > 0
        ? coefficients.reduce((s, c) => s + c.coefficient, 0) / coefficients.length
        : 0

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/accounting/inflation-coefficients/revalue">
                            <Calculator className="mr-2 h-4 w-4" />
                            {t("applyRevaluation")}
                        </Link>
                    </Button>
                    <RoleGate allow="MANAGER">
                    <Button asChild>
                        <Link href="/accounting/inflation-coefficients/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("newCoefficient")}
                        </Link>
                    </Button>
                    </RoleGate>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalRecords")}</p>
                            <p className="text-2xl font-bold">{coefficients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("avgCoefficient")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {avgCoefficient.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <LineChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("coveredYears")}</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {new Set(coefficients.map((c) => c.year)).size}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Calculator className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("revaluationReady")}</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {coefficients.length > 0 ? t("yes") : t("no")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <InflationCoefficientsTable data={coefficients} />
            </div>
        </div>
    )
}
