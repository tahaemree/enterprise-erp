"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft, Eye, Pencil, Trash2 } from "lucide-react"
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

export type Transaction = {
    id: string
    type: "INCOME" | "EXPENSE" | "REFUND" | "TRANSFER"
    category: string | null
    description: string
    amount: number
    reference?: string | null
    date: Date
    createdAt: Date
}

const typeConfig: Record<string, { labelKey: string; icon: React.ElementType; className: string }> = {
    INCOME: {
        labelKey: "transactionForm.type_INCOME",
        icon: ArrowDownLeft,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    EXPENSE: {
        labelKey: "transactionForm.type_EXPENSE",
        icon: ArrowUpRight,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    REFUND: {
        labelKey: "transactionForm.type_REFUND",
        icon: ArrowDownLeft,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    TRANSFER: {
        labelKey: "transactionForm.type_TRANSFER",
        icon: ArrowUpRight,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
}

const categoryConfig: Record<string, { icon: string; labelKey: string }> = {
    sales: { icon: "📊", labelKey: "transactionForm.category_SALES" },
    services: { icon: "🔧", labelKey: "transactionForm.category_SERVICE" },
    investments: { icon: "📈", labelKey: "transactionForm.category_INVESTMENT" },
    refunds: { icon: "↩️", labelKey: "transactionForm.type_REFUND" },
    salaries: { icon: "👥", labelKey: "transactionForm.category_SALARY" },
    rent: { icon: "🏢", labelKey: "transactionForm.category_RENT" },
    utilities: { icon: "💡", labelKey: "transactionForm.category_UTILITIES" },
    supplies: { icon: "📦", labelKey: "transactionForm.category_PURCHASE" },
    marketing: { icon: "📢", labelKey: "transactionForm.category_MARKETING" },
    software: { icon: "💻", labelKey: "transactionForm.category_OFFICE" },
    travel: { icon: "✈️", labelKey: "transactionForm.category_TRAVEL" },
    equipment: { icon: "🛠️", labelKey: "transactionForm.category_MAINTENANCE" },
    taxes: { icon: "📋", labelKey: "transactionForm.category_TAX" },
    insurance: { icon: "🛡️", labelKey: "transactionForm.category_INSURANCE" },
    other: { icon: "📁", labelKey: "transactionForm.category_OTHER_EXPENSE" },
}

export const createTransactionColumns = (t: any, onDelete?: (id: string) => void): ColumnDef<Transaction>[] => [
    {
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.type")} />
        ),
        cell: ({ row }) => {
            const type = row.getValue("type") as Transaction["type"]
            const config = typeConfig[type]!
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
        accessorKey: "category",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.category")} />
        ),
        cell: ({ row }) => {
            const category = row.getValue("category") as string
            const entry = categoryConfig[category.toLowerCase()]
            if (!entry) return <span className="font-medium">{category}</span>
            return <span className="font-medium">{entry.icon} {t(entry.labelKey)}</span>
        },
    },
    {
        accessorKey: "description",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.description")} />
        ),
        cell: ({ row }) => {
            const description = row.getValue("description") as string
            return (
                <span className="max-w-[300px] truncate font-medium">
                    {description}
                </span>
            )
        },
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.amount")} />
        ),
        cell: ({ row }) => {
            const amount = row.getValue("amount") as number
            const type = row.original.type

            return (
                <span className={`font-medium ${type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {type === "INCOME" ? "+" : "-"}{formatCurrency(amount)}
                </span>
            )
        },
    },
    {
        accessorKey: "reference",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.reference")} />
        ),
        cell: ({ row }) => {
            const reference = row.getValue("reference") as string | null

            return reference ? (
                <span className="text-muted-foreground">{reference}</span>
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        },
    },
    {
        accessorKey: "date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.transactions.date")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("date") as Date
            return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const transaction = row.original

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
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("common.edit")}
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
                            <AlertDialogTitle>{t("common.delete")} {t("finance.transactions.type")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: ""})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(transaction.id)}
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
