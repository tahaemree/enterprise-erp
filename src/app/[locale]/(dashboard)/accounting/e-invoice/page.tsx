import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, FileDigit, Truck, Send, Ban } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { EInvoicesTable } from "@/components/accounting/einvoices-table"
import { type EInvoice } from "@/components/accounting/einvoice-columns"
import { getEInvoices } from "@/lib/actions/tr-accounting"

export default async function EInvoiceListPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.einvoice")

    const invoicesData = await getEInvoices()

    const invoices: EInvoice[] = invoicesData.map((inv) => ({
        id: inv.id,
        uuid: inv.uuid,
        documentType: inv.documentType as import("@prisma/client").DocumentType,
        profile: inv.profile,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        senderTaxId: inv.senderTaxId,
        senderName: inv.senderName,
        receiverTaxId: inv.receiverTaxId,
        receiverName: inv.receiverName,
        receiverEmail: inv.receiverEmail,
        grossTotal: inv.grossTotal,
        vatBaseTotal: inv.vatBaseTotal,
        vatTotal: inv.vatTotal,
        netTotal: inv.netTotal,
        withholdingTotal: inv.withholdingTotal,
        currency: inv.currency,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        retryCount: inv.retryCount,
        lastError: inv.lastError,
        notes: inv.notes,
        createdAt: inv.createdAt,
    }))

    const acceptedCount = invoices.filter(i => i.status === "GIB_ACCEPTED").length
    const draftCount = invoices.filter(i => i.status === "DRAFT").length
    const errorCount = invoices.filter(i => i.status === "ERROR").length

    return (                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/accounting/despatch-advice">
                            <Truck className="mr-2 h-4 w-4" />
                            {t("goToDespatch")}
                        </Link>
                    </Button>
                    <RoleGate allow="MANAGER">
                    <Button asChild>
                        <Link href="/accounting/e-invoice/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("newEinvoice")}
                        </Link>
                    </Button>
                    </RoleGate>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileDigit className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">                            {t("total")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{invoices.length}</p>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accepted")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{acceptedCount}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <FileDigit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("draft")}</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{draftCount}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("errors")}</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <EInvoicesTable data={invoices} />
        </div>
    )
}
