"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Pencil, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
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
import { formatCurrency } from "@/lib/utils"

export type SupplierAccount = {
    id: string
    accountCode: string
    supplier: {
        id: string
        name: string
        contactName?: string | null
        email?: string | null
    }
    currentBalance: number
    overdueBalance: number
    riskLimit: number
    paymentTerms: number
    notes?: string | null
    createdAt: Date
}

export const createSupplierAccountColumns = (onDelete?: (id: string) => void): ColumnDef<SupplierAccount>[] => [
    {
        accessorKey: "accountCode",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Account Code" />
        ),
        cell: ({ row }) => (
            <span className="font-mono font-medium">{row.getValue("accountCode")}</span>
        ),
    },
    {
        accessorKey: "supplier",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Supplier" />
        ),
        cell: ({ row }) => {
            const supplier = row.original.supplier
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{supplier.name}</span>
                    {supplier.contactName && (
                        <span className="text-xs text-muted-foreground">{supplier.contactName}</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "currentBalance",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Balance" />
        ),
        cell: ({ row }) => {
            const balance = row.getValue("currentBalance") as number
            return (
                <span className={`font-medium ${balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    {formatCurrency(Math.abs(balance))}
                    {balance > 0 ? " (Dr)" : " (Cr)"}
                </span>
            )
        },
    },
    {
        accessorKey: "overdueBalance",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Overdue" />
        ),
        cell: ({ row }) => {
            const overdue = row.getValue("overdueBalance") as number
            return (
                <span className={overdue > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                    {overdue > 0 ? formatCurrency(overdue) : "—"}
                </span>
            )
        },
    },
    {
        accessorKey: "paymentTerms",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Terms" />
        ),
        cell: ({ row }) => {
            const terms = row.getValue("paymentTerms") as number
            return <span className="text-muted-foreground">{terms} days</span>
        },
    },
    {
        id: "riskIndicator",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const overdue = row.original.overdueBalance

            if (overdue > 0) {
                return (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Overdue
                    </Badge>
                )
            }
            return (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Current
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const account = row.original

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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Supplier Account</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete account &quot;{account.accountCode}&quot; for {account.supplier.name}? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(account.id)}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]
