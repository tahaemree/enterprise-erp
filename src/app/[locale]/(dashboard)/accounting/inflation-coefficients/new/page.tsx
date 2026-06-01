import { InflationCoefficientForm } from "@/components/accounting/inflation-coefficient-form"

export default async function NewInflationCoefficientPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Inflation Coefficient</h1>
                <p className="text-muted-foreground">
                    Add a new monthly inflation correction coefficient (TÜİK Yİ-ÜFE based).
                </p>
            </div>
            <div className="max-w-2xl">
                <InflationCoefficientForm />
            </div>
        </div>
    )
}
