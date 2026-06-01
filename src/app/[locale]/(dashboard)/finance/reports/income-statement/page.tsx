import { getTranslations } from "next-intl/server"
import { BarChart3 } from "lucide-react"
import { IncomeStatementClient } from "./client"

export default async function IncomeStatementPage() {
    const t = await getTranslations("reports")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BarChart3 className="h-7 w-7 text-primary" />
                    {t("incomeStatement")}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("incomeStatementDescription")}
                </p>
            </div>
            <IncomeStatementClient />
        </div>
    )
}
