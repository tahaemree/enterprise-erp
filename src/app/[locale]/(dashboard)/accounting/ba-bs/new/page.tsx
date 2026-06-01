import { BaBsForm } from "@/components/accounting/ba-bs-form"

export default async function NewBaBsFormPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Generate BA/BS Form</h1>
                <p className="text-muted-foreground">
                    Automatically generate BA or BS forms from your e-invoices for a specific period.
                    Items are grouped by tax ID and sorted by amount.
                </p>
            </div>
            <BaBsForm />
        </div>
    )
}
