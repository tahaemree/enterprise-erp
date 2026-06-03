"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Trash2, Send, Ban, FileDigit, FileArchive, Truck, RefreshCw } from "lucide-react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { AppTranslator } from "@/lib/i18n-types"

export type EInvoice = {
    id: string
    uuid: string
    documentType: "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE" | "LEDGER"
    profile?: string | null
    invoiceNumber?: string | null
    status: string
    senderTaxId: string
    senderName: string
    receiverTaxId: string
    receiverName: string
    receiverEmail?: string | null
    grossTotal: number
    vatBaseTotal: number
    vatTotal: number
    netTotal: number
    withholdingTotal: number
    currency: string
    issueDate: Date
    dueDate?: Date | null
    retryCount: number
    lastError?: string | null
    notes?: string | null
    createdAt: Date
}

function getStatusBadge(status: string, t: AppTranslator) {
    const variants: Record<string, { labelKey: string; className: string }> = {
        DRAFT: { labelKey: "status_draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
        PENDING_SIGN: { labelKey: "status_pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
        SIGNED: { labelKey: "status_signed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
        SENDING: { labelKey: "status_sending", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
        SENT_TO_GIB: { labelKey: "status_sent", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
        GIB_ACCEPTED: { labelKey: "status_accepted", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
        GIB_REJECTED: { labelKey: "status_rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
        GIB_WARNING: { labelKey: "status_warning", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
        CANCELLED: { labelKey: "status_cancelled", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
        ERROR: { labelKey: "status_failed", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    }
    const variant = variants[status]
    return {
        label: variant ? t(variant.labelKey) : status,
        className: variant ? variant.className : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
}

function getDocumentTypeIcon(type: string) {
    switch (type) {
        case "INVOICE": return <FileDigit className="h-4 w-4" />
        case "ARCHIVE": return <FileArchive className="h-4 w-4" />
        case "DESPATCH_ADVICE": return <Truck className="h-4 w-4" />
        default: return <FileDigit className="h-4 w-4" />
    }
}

export const createEInvoiceColumns = (
    t: AppTranslator,
    onDelete?: (id: string) => void,
    onSubmit?: (id: string) => void,
    onRetry?: (id: string) => void,
    onCancel?: (id: string) => void,
): ColumnDef<EInvoice>[] => [
    {
        accessorKey: "documentType",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("type")} />
        ),
        cell: ({ row }) => {
            const type = row.getValue("documentType") as string
            return (
                <div className="flex items-center gap-2">
                    {getDocumentTypeIcon(type)}
                    <span className="text-xs font-medium">
                        {type === "INVOICE" ? "e-Fatura" : type === "ARCHIVE" ? "e-Arşiv" : type === "DESPATCH_ADVICE" ? "e-İrsaliye" : type}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const variant = getStatusBadge(status, t)
            return (
                <Badge variant="secondary" className={variant.className}>
                    {variant.label}
                </Badge>
            )
        },
    },
    {
        id: "invoiceNo",
        accessorFn: (row) => row.invoiceNumber || row.uuid,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("invoiceNo")} />
        ),
        cell: ({ row }) => {
            const invoice = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-medium">
                        {invoice.invoiceNumber || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        UUID: {invoice.uuid.substring(0, 8)}...
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "receiverName",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("receiver")} />
        ),
        cell: ({ row }) => {
            const invoice = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{invoice.receiverName}</span>
                    <span className="text-xs text-muted-foreground">VKN: {invoice.receiverTaxId}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "netTotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("total")} />
        ),
        cell: ({ row }) => {
            const total = row.getValue("netTotal") as number
            const currency = row.original.currency
            return (
                <span className="font-medium">{formatCurrency(total, currency)}</span>
            )
        },
    },
    {
        accessorKey: "issueDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("issueDate")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("issueDate") as Date
            return <span className="text-muted-foreground text-sm">{formatDate(date)}</span>
        },
    },
    {
        id: "retryInfo",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("actions")} />
        ),
        cell: ({ row }) => {
            const retryCount = row.original.retryCount
            if (retryCount === 0) return <span className="text-muted-foreground text-xs">—</span>
            return (
                <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">{retryCount}x</span>
                </div>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const invoice = row.original
            const canSend = invoice.status === "DRAFT" || invoice.status === "ERROR"
            const canRetry = invoice.status === "ERROR" || invoice.status === "GIB_REJECTED"
            const canCancel = invoice.status !== "GIB_ACCEPTED" && invoice.status !== "CANCELLED"

            return (
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.location.href = `/accounting/e-invoice/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("viewDetail")}
                            </DropdownMenuItem>
                            {canSend && (
                                <DropdownMenuItem onClick={() => onSubmit?.(invoice.id)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {t("submitGib")}
                                </DropdownMenuItem>
                            )}
                            {canRetry && (
                                <DropdownMenuItem onClick={() => onRetry?.(invoice.id)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t("retrySubmission")}
                                </DropdownMenuItem>
                            )}
                            {canCancel && (
                                <DropdownMenuItem onClick={() => onCancel?.(invoice.id)}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t("cancel")}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("delete")}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("deleteDescription")} ({invoice.invoiceNumber || invoice.uuid})
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(invoice.id)}
                            >
                                {t("delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]
