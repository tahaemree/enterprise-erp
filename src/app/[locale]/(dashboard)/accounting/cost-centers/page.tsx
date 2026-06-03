import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Briefcase, Layers, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import { type CostCenterRow } from "@/components/finance/cost-center-columns"
import { CostCentersTable } from "@/components/finance/cost-centers-table"
import { getCostCenters } from "@/lib/actions/cost-centers"

export default async function AccountingCostCentersPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const costCentersData = await getCostCenters()
    const costCenters: CostCenterRow[] = costCentersData.map((cc: { id: string; code: string; name: string; description: string | null; isActive: boolean }) => ({
        id: cc.id,
        code: cc.code,
        name: cc.name,
        description: cc.description,
        isActive: cc.isActive
    }))

    const t = await getTranslations()

    const activeCount = costCenters.filter(c => c.isActive).length
    const inactiveCount = costCenters.length - activeCount

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("accounting.costCenters.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("accounting.costCenters.description")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span>{t("accounting.costCenters.centers", { count: costCenters.length })}</span>
                    </div>
                    <RoleGate allow="MANAGER">
                    <Button asChild>
                        <Link href="/accounting/cost-centers/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("accounting.costCenters.addCenter")}
                        </Link>
                    </Button>
                    </RoleGate>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.costCenters.activeCenters")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {activeCount}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <XCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.costCenters.inactive")}</p>
                            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                                {inactiveCount}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.costCenters.total")}</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {costCenters.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <CostCentersTable data={costCenters} searchPlaceholder={t("accounting.costCenters.search")} />
            </div>
        </div>
    )
}
