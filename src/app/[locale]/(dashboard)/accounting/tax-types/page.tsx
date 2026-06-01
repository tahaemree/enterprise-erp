import { Link } from "@/i18n/navigation"
import { Plus, Percent, BadgeCheck, Layers, AlertCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { TaxTypesTable } from "@/components/accounting/tax-types-table"
import { type TaxType } from "@/components/accounting/tax-type-columns"
import { getTaxTypes } from "@/lib/actions/tr-accounting"

export default async function TaxTypesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    const taxTypeData = await getTaxTypes()
    const taxTypes: TaxType[] = taxTypeData.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        rate: Number(t.rate),
        category: t.category as TaxType["category"],
        description: t.description,
        isActive: t.isActive,
        createdAt: t.createdAt,
    }))

    const vatCount = taxTypes.filter((t) => t.category === "VAT").length
    const withholdingCount = taxTypes.filter((t) => t.category === "WITHHOLDING").length
    const stopajCount = taxTypes.filter((t) => t.category === "STOPAJ").length

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("accounting.taxTypes.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("accounting.taxTypes.description")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/accounting/tax-calculator">
                            <Percent className="mr-2 h-4 w-4" />
                            {t("accounting.taxTypes.taxCalculator")}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/accounting/tax-types/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("accounting.taxTypes.newTaxType")}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.taxTypes.totalTaxTypes")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{taxTypes.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.taxTypes.kdvRates")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{vatCount}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.taxTypes.tevkifat")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{withholdingCount}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.taxTypes.stopaj")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{stopajCount}</p>
                </div>
            </div>

            <TaxTypesTable data={taxTypes} />
        </div>
    )
}
