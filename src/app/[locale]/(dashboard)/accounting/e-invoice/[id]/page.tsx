import { notFound } from "next/navigation"
import { getEInvoiceById, submitEInvoiceToGib, cancelEInvoice, retryEInvoiceSubmission } from "@/lib/actions/tr-accounting"
import { EInvoiceDetail, type EInvoiceDetailData } from "@/components/accounting/einvoice-detail"
import { redirect } from "next/navigation"

interface Props {
    params: Promise<{ locale: string; id: string }>
}

export default async function EInvoiceDetailPage({ params }: Props) {
    const { id } = await params
    const invoice = await getEInvoiceById(id)

    if (!invoice) {
        notFound()
    }

    const detail: EInvoiceDetailData = {
        id: invoice.id,
        uuid: invoice.uuid,
        documentType: invoice.documentType,
        profile: invoice.profile,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        senderTaxId: invoice.senderTaxId,
        senderName: invoice.senderName,
        receiverTaxId: invoice.receiverTaxId,
        receiverName: invoice.receiverName,
        receiverEmail: invoice.receiverEmail,
        grossTotal: invoice.grossTotal,
        vatBaseTotal: invoice.vatBaseTotal,
        vatTotal: invoice.vatTotal,
        netTotal: invoice.netTotal,
        withholdingTotal: invoice.withholdingTotal,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        retryCount: invoice.retryCount,
        lastError: invoice.lastError,
        lastAttemptAt: invoice.lastAttemptAt,
        notes: invoice.notes,
        xmlContent: invoice.xmlContent,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
    }

    async function handleSubmit(id: string) {
        "use server"
        await submitEInvoiceToGib(id)
        redirect(`/accounting/e-invoice/${id}`)
    }

    async function handleCancel(id: string) {
        "use server"
        await cancelEInvoice(id)
        redirect(`/accounting/e-invoice/${id}`)
    }

    async function handleRetry(id: string) {
        "use server"
        await retryEInvoiceSubmission(id)
        redirect(`/accounting/e-invoice/${id}`)
    }

    return (
        <EInvoiceDetail
            invoice={detail}
            onBack={() => redirect("/accounting/e-invoice")}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onRetry={handleRetry}
        />
    )
}
