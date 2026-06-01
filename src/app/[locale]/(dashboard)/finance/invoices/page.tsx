import { Link } from "@/i18n/navigation"
import { Plus, FileText, Send, CheckCircle, Clock } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/tables/data-table"
import { type Invoice } from "@/components/finance/invoice-columns"
import { InvoicesTable } from "@/components/finance/invoices-table"
import { formatCurrency } from "@/lib/utils"
import { getOrders } from "@/lib/actions/orders"

function mapOrderStatusToInvoiceStatus(
    orderStatus: string,
    paymentStatus: string,
    dueDate: Date | null
): Invoice["status"] {
    if (orderStatus === "CANCELLED" || orderStatus === "REFUNDED") {
        return "CANCELLED"
    }
    if (orderStatus === "DRAFT") {
        return "DRAFT"
    }
    if (
        orderStatus === "DELIVERED" ||
        orderStatus === "COMPLETED" ||
        paymentStatus === "paid"
    ) {
        return "PAID"
    }
    if (
        dueDate &&
        new Date(dueDate) < new Date() &&
        paymentStatus !== "paid"
    ) {
        return "OVERDUE"
    }
    return "SENT"
}

export default async function InvoicesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("finance.invoices")

    const ordersData = await getOrders()

    const invoices: Invoice[] = ordersData.map((order) => ({
        id: order.id,
        invoiceNumber: order.orderNumber.replace("ORD", "INV"),
        customer: {
            id: order.customer?.id || "",
            firstName: order.customer?.firstName || "Unknown",
            lastName: order.customer?.lastName || "",
            company: order.customer?.company || null,
            email: order.customer?.email || "",
        },
        status: mapOrderStatusToInvoiceStatus(
            order.status,
            order.paymentStatus,
            order.dueDate
        ),
        subtotal: Number(order.subtotal),
        tax: Number(order.taxAmount),
        total: Number(order.total),
        dueDate: order.dueDate || order.createdAt,
        createdAt: order.createdAt,
    }))

    const draftInvoices = invoices.filter((i) => i.status === "DRAFT")
    const sentInvoices = invoices.filter((i) => i.status === "SENT")
    const paidInvoices = invoices.filter((i) => i.status === "PAID")
    const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE")

    const totalOutstanding = invoices
        .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
        .reduce((sum, i) => sum + i.total, 0)
    const totalPaid = paidInvoices.reduce((sum, i) => sum + i.total, 0)
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total, 0)

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/finance/invoices/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("newInvoice")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("draft")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{draftInvoices.length}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                            <FileText className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("outstanding")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                                {formatCurrency(totalOutstanding)}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                            <Send className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("overdue")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                                {formatCurrency(totalOverdue)}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-transform group-hover:scale-110">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("collected")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalPaid)}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">
                        {t("all")} ({invoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="draft">
                        {t("draft")} ({draftInvoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        {t("sent")} ({sentInvoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="overdue">
                        {t("overdue")} ({overdueInvoices.length})
                    </TabsTrigger>
                    <TabsTrigger value="paid">
                        {t("paid")} ({paidInvoices.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <InvoicesTable data={invoices} searchPlaceholder={t("searchInvoices")} />
                </TabsContent>
                <TabsContent value="draft" className="space-y-4">
                    <InvoicesTable data={draftInvoices} searchPlaceholder={t("searchInvoices")} />
                </TabsContent>
                <TabsContent value="sent" className="space-y-4">
                    <InvoicesTable data={sentInvoices} searchPlaceholder={t("searchInvoices")} />
                </TabsContent>
                <TabsContent value="overdue" className="space-y-4">
                    <InvoicesTable data={overdueInvoices} searchPlaceholder={t("searchInvoices")} />
                </TabsContent>
                <TabsContent value="paid" className="space-y-4">
                    <InvoicesTable data={paidInvoices} searchPlaceholder={t("searchInvoices")} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
