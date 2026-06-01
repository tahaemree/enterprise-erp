import { RevaluationForm } from "@/components/accounting/revaluation-form"

export default async function RevalueBalancesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Enflasyon Düzeltmesi</h1>
                <p className="text-muted-foreground">
                    Apply inflation correction to all customer and supplier accounts using
                    the specified coefficient. A balancing journal entry will be generated.
                </p>
            </div>
            <RevaluationForm />
        </div>
    )
}
