import { getTranslations } from "next-intl/server"
import { TaxCalculatorForm } from "@/components/accounting/tax-calculator-form"

export default async function TaxCalculatorPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("accounting.taxCalculator.title")}</h1>
                <p className="text-muted-foreground">
                    {t("accounting.taxCalculator.description")}
                </p>
            </div>
            <TaxCalculatorForm />
        </div>
    )
}
