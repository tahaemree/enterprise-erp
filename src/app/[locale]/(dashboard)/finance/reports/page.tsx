import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { BarChart3, Scale, Table2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const REPORTS = [
    {
        titleKey: "incomeStatement",
        descriptionKey: "incomeStatementDescription",
        href: "/finance/reports/income-statement",
        icon: BarChart3,
        color: "text-green-600 bg-green-500/10",
    },
    {
        titleKey: "balanceSheet",
        descriptionKey: "balanceSheetDescription",
        href: "/finance/reports/balance-sheet",
        icon: Scale,
        color: "text-blue-600 bg-blue-500/10",
    },
    {
        titleKey: "pivotAnalysis",
        descriptionKey: "pivotDescription",
        href: "/finance/reports/pivot",
        icon: Table2,
        color: "text-purple-600 bg-purple-500/10",
    },
]

export default async function ReportsPage() {
    const t = await getTranslations("reports")

    return (
        <div className="space-y-6">

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {REPORTS.map((report) => {
                    const Icon = report.icon
                    return (
                        <Link key={report.href} href={report.href}>
                            <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 h-full">
                                <CardHeader>
                                    <div className={`rounded-lg w-fit p-3 ${report.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="mt-4">{t(report.titleKey)}</CardTitle>
                                    <CardDescription>
                                        {t(report.descriptionKey)}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
