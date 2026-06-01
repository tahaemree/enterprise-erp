"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Download, Send, Trash2, CheckCircle, Clock, XCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatCurrency, formatDate } from "@/lib/utils"

export type Invoice = {
    id: string
    invoiceNumber: string
    customer: {
        id: string
        firstName: string
        lastName: string
        company?: string | null
        email: string
    }
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
    subtotal: number
    tax: number
    total: number
    dueDate: Date
    createdAt: Date
}

const statusConfig = {
    DRAFT: {
        labelKey: "status.DRAFT",
        icon: FileText,
        className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    },
    SENT: {
        labelKey: "common.sent",
        icon: Send,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    PAID: {
        labelKey: "common.paid",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    OVERDUE: {
        labelKey: "common.overdue",
        icon: Clock,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    CANCELLED: {
        labelKey: "status.CANCELLED",
        icon: XCircle,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    },
}

export const createInvoiceColumns = (t: any): ColumnDef<Invoice>[] => [
    {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.invoiceNumber")} />
        ),
        cell: ({ row }) => {
            const invoiceNumber = row.getValue("invoiceNumber") as string
            return <span className="font-mono font-medium">{invoiceNumber}</span>
        },
    },
    {
        accessorKey: "customer",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.customer")} />
        ),
        cell: ({ row }) => {
            const customer = row.original.customer

            return (
                <div>
                    <p className="font-medium">
                        {customer.firstName} {customer.lastName}
                    </p>
                    {customer.company && (
                        <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as Invoice["status"]
            const config = statusConfig[status]
            const Icon = config.icon

            return (
                <Badge variant="secondary" className={config.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {t(config.labelKey)}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "subtotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.subtotal")} />
        ),
        cell: ({ row }) => {
            const subtotal = row.getValue("subtotal") as number
            return <span className="text-muted-foreground">{formatCurrency(subtotal)}</span>
        },
    },
    {
        accessorKey: "tax",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.tax")} />
        ),
        cell: ({ row }) => {
            const tax = row.getValue("tax") as number
            return <span className="text-muted-foreground">{formatCurrency(tax)}</span>
        },
    },
    {
        accessorKey: "total",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.total")} />
        ),
        cell: ({ row }) => {
            const total = row.getValue("total") as number
            return <span className="font-medium">{formatCurrency(total)}</span>
        },
    },
    {
        accessorKey: "dueDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.dueDate")} />
        ),
        cell: ({ row }) => {
            const dueDate = row.getValue("dueDate") as Date
            const status = row.original.status
            const isOverdue = status === "OVERDUE" || (status !== "PAID" && status !== "CANCELLED" && new Date(dueDate) < new Date())

            return (
                <span className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                    {formatDate(dueDate)}
                </span>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.invoices.created")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date
            return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const invoice = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("common.openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("common.viewInvoice")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            {t("common.downloadPdf")}
                        </DropdownMenuItem>
                        {invoice.status === "DRAFT" && (
                            <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                {t("common.sendToCustomer")}
                            </DropdownMenuItem>
                        )}
                        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                            <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t("common.markAsPaid")}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.delete")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
