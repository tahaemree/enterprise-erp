"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Truck, Trash2 } from "lucide-react"
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

export type DespatchAdvice = {
    id: string
    uuid: string
    invoiceNumber?: string | null
    status: string
    senderName: string
    senderTaxId: string
    receiverName: string
    receiverTaxId: string
    grossTotal: number
    netTotal: number
    currency: string
    issueDate: Date
    createdAt: Date
}

function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string }> = {
        DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
        PENDING_SIGN: { label: "Pending Sign", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
        SIGNED: { label: "Signed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
        SENDING: { label: "Sending", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
        SENT_TO_GIB: { label: "Sent to GİB", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
        GIB_ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
        GIB_REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
        CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
    }
    return variants[status] || { label: status, className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" }
}

export const createDespatchAdviceColumns = (
    t: AppTranslator,
    onDelete?: (id: string) => void,
): ColumnDef<DespatchAdvice>[] => [
    {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("accounting.despatchAdvice.despatchNumber")} />
        ),
        cell: ({ row }) => {
            const number = row.getValue("invoiceNumber") as string | null
            return (
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-medium">{number || "—"}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("accounting.despatchAdvice.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const variant = getStatusBadge(status)
            return (
                <Badge variant="secondary" className={variant.className}>
                    {t.has?.(`status.${status}`) ? t(`status.${status}`) : variant.label}
                </Badge>
            )
        },
    },
    {
        accessorKey: "receiverName",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("accounting.despatchAdvice.receiverName")} />
        ),
        cell: ({ row }) => {
            const adv = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{adv.receiverName}</span>
                    <span className="text-xs text-muted-foreground">VKN: {adv.receiverTaxId}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "netTotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("accounting.despatchAdvice.netTotal")} />
        ),
        cell: ({ row }) => {
            const total = row.getValue("netTotal") as number
            return <span className="font-medium">{formatCurrency(total, row.original.currency)}</span>
        },
    },
    {
        accessorKey: "issueDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("accounting.despatchAdvice.issueDate")} />
        ),
        cell: ({ row }) => {
            return <span className="text-muted-foreground text-sm">{formatDate(row.getValue("issueDate") as Date)}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const adv = row.original
            return (
                <AlertDialog>
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
                            <DropdownMenuItem onClick={() => window.location.href = `/accounting/e-invoice/${adv.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("common.deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: adv.invoiceNumber || adv.uuid})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(adv.id)}
                            >
                                {t("common.delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]
