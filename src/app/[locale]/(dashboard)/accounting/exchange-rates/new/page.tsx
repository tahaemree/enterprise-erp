import { ExchangeRateForm } from "@/components/accounting/exchange-rate-form"

export default async function NewExchangeRatePage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Exchange Rate</h1>
                <p className="text-muted-foreground">
                    Record a new currency exchange rate for financial calculations.
                </p>
            </div>
            <div className="max-w-2xl">
                <ExchangeRateForm />
            </div>
        </div>
    )
}
