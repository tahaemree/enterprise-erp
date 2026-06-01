import { getTranslations } from "next-intl/server"
import { Scale } from "lucide-react"
import { BalanceSheetClient } from "./client"

export default async function BalanceSheetPage() {
    const t = await getTranslations("reports")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Scale className="h-7 w-7 text-primary" />
                    {t("balanceSheet")}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("balanceSheetDescription")}
                </p>
            </div>
            <BalanceSheetClient />
        </div>
    )
}
