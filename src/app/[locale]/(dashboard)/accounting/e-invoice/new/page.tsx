import { getTranslations } from "next-intl/server"
import { EInvoiceForm } from "@/components/accounting/einvoice-form"

export default async function NewEInvoicePage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ type?: string }>
}) {
    const t = await getTranslations("finance.eInvoice")
    const sp = await searchParams
    const defaultType = sp.type === "archive" ? "ARCHIVE" : sp.type === "despatch" ? "DESPATCH_ADVICE" : "INVOICE"

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New e-Invoice</h1>
                <p className="text-muted-foreground">
                    {t("description")} — UBL TR 2.1 formatında oluşturulacaktır.
                </p>
            </div>
            <div className="max-w-4xl">
                <EInvoiceForm defaultType={defaultType} />
            </div>
        </div>
    )
}
