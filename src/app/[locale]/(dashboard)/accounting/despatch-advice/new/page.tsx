import { EInvoiceForm } from "@/components/accounting/einvoice-form"

export default async function NewDespatchAdvicePage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New e-İrsaliye</h1>
                <p className="text-muted-foreground">
                    Yeni bir e-İrsaliye (sevk irsaliyesi) oluşturun. UBL TR 2.1 formatında XML üretilecektir.
                </p>
            </div>
            <div className="max-w-4xl">
                <EInvoiceForm defaultType="DESPATCH_ADVICE" />
            </div>
        </div>
    )
}
