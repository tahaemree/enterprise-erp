"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { MoreHorizontal, Eye, Pencil, Trash2, FileText } from "lucide-react"
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

export type AccountEntry = {
    id: string
    entryNumber: string
    entryType: "DEBIT_NOTE" | "CREDIT_NOTE" | "OPENING" | "CLOSING" | "TRANSFER" | "CORRECTION"
    description: string
    entryDate: Date
    lines: Array<{
        id: string
        side: "DEBIT" | "CREDIT"
        amount: number
        description?: string | null
    }>
    createdAt: Date
}



const entryTypeConfig = (t: (key: string) => string): Record<string, { label: string; className: string }> => ({
    DEBIT_NOTE: { label: t("entryTypeDebitNote"), className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    CREDIT_NOTE: { label: t("entryTypeCreditNote"), className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    OPENING: { label: t("entryTypeOpening"), className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    CLOSING: { label: t("entryTypeClosing"), className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    TRANSFER: { label: t("entryTypeTransfer"), className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
    CORRECTION: { label: t("entryTypeCorrection"), className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
})

export const createAccountEntryColumns = (onDelete?: (id: string) => void): ColumnDef<AccountEntry>[] => {
    const t = useTranslations("accounting.accountEntries.columns")
    const tc = entryTypeConfig(t)
    return [
    {
        accessorKey: "entryNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("entryNo")} />
        ),
        cell: ({ row }) => (
            <span className="font-mono font-medium">{row.getValue("entryNumber")}</span>
        ),
    },
    {
        accessorKey: "entryType",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("type")} />
        ),
        cell: ({ row }) => {
            const type = row.getValue("entryType") as AccountEntry["entryType"]
            const config = tc[type]!
            return (
                <Badge variant="secondary" className={config.className}>
                    {config.label}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "description",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("description")} />
        ),
        cell: ({ row }) => {
            const desc = row.getValue("description") as string
            return (
                <span className="max-w-[300px] truncate font-medium">
                    {desc}
                </span>
            )
        },
    },
    {
        id: "debitTotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("debit")} />
        ),
        cell: ({ row }) => {
            const total = row.original.lines
                .filter((l) => l.side === "DEBIT")
                .reduce((sum, l) => sum + l.amount, 0)
            return (
                <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(total)}
                </span>
            )
        },
    },
    {
        id: "creditTotal",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("credit")} />
        ),
        cell: ({ row }) => {
            const total = row.original.lines
                .filter((l) => l.side === "CREDIT")
                .reduce((sum, l) => sum + l.amount, 0)
            return (
                <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(total)}
                </span>
            )
        },
    },
    {
        id: "lineCount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("lines")} />
        ),
        cell: ({ row }) => {
            const count = row.original.lines.length
            return <span className="text-muted-foreground">{count}</span>
        },
    },
    {
        accessorKey: "entryDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("date")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("entryDate") as Date
            return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const entry = row.original

            return (
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t("openMenu")}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("editEntry")}
                            </DropdownMenuItem>
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
                                {t("deleteDescription", { entryNumber: entry.entryNumber })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(entry.id)}
                            >
                                {t("deleteConfirm")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]
}
