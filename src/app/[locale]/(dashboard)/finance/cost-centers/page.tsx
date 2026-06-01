import { Link } from "@/i18n/navigation"
import { Plus, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import { type CostCenterRow } from "@/components/finance/cost-center-columns"
import { CostCentersTable } from "@/components/finance/cost-centers-table"
import { getCostCenters } from "@/lib/actions/cost-centers"

export default async function CostCentersPage({
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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("finance.costCenters.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("finance.costCenters.description")}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/finance/cost-centers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("finance.costCenters.addCenter")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("finance.costCenters.activeCenters")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {activeCount}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("finance.costCenters.inactive")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-400">
                        {inactiveCount}
                    </p>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <CostCentersTable data={costCenters} searchPlaceholder={t("finance.costCenters.search")} />
            </div>
        </div>
    )
}
