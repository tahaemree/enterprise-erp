import { TaxTypeForm } from "@/components/accounting/tax-type-form"

export default async function NewTaxTypePage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Tax Type</h1>
                <p className="text-muted-foreground">
                    Add a new KDV rate, tevkifat ratio, or stopaj rate.
                </p>
            </div>
            <div className="max-w-2xl">
                <TaxTypeForm />
            </div>
        </div>
    )
}
