import { CurrencyForm } from "@/components/accounting/currency-form"

export default async function NewCurrencyPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Currency</h1>
                <p className="text-muted-foreground">
                    Add a new currency definition for exchange rate tracking.
                </p>
            </div>
            <div className="max-w-2xl">
                <CurrencyForm />
            </div>
        </div>
    )
}
