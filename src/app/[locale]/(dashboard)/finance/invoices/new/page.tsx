import { getTranslations } from "next-intl/server"
import { InvoiceForm } from "@/components/finance/invoice-form"

export default async function NewInvoicePage() {
    const t = await getTranslations("invoiceForm")

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-4xl">
                <InvoiceForm />
            </div>
        </div>
    )
}
