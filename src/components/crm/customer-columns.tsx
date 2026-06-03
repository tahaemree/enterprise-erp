"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone, Building2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { formatCurrency, getInitials } from "@/lib/utils"
import type { AppTranslator } from "@/lib/i18n-types"

export type Customer = {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    company?: string
    status: "LEAD" | "QUALIFIED" | "OPPORTUNITY" | "PROPOSAL" | "NEGOTIATION" | "CUSTOMER" | "CHURNED"
    source: string
    totalSpent: number
    orderCount: number
    createdAt: Date
}

const statusColors: Record<string, string> = {
    LEAD: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    QUALIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    OPPORTUNITY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    PROPOSAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    NEGOTIATION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    CUSTOMER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CHURNED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export const createCustomerColumns = (t: AppTranslator, onDelete?: (id: string) => void): ColumnDef<Customer>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label={t("common.selectAll")}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t("common.selectRow")}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "firstName",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("customers.customer")} />
        ),
        cell: ({ row }) => {
            const customer = row.original
            const fullName = `${customer.firstName} ${customer.lastName}`
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{fullName}</span>
                        {customer.company && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {customer.company}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("customers.contact")} />
        ),
        cell: ({ row }) => {
            const customer = row.original
            return (
                <div className="flex flex-col gap-1">
                    {customer.email && (
                        <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                        </div>
                    )}
                    {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("customers.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge className={statusColors[status]} variant="outline">
                    {t("status." + status)}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "totalSpent",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("customers.totalSpent")} />
        ),
        cell: ({ row }) => {
            const amount = row.getValue("totalSpent") as number
            return <span className="font-medium">{formatCurrency(amount)}</span>
        },
    },
    {
        accessorKey: "orderCount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("customers.orders")} />
        ),
        cell: ({ row }) => {
            return <Badge variant="secondary">{row.getValue("orderCount")}</Badge>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const customer = row.original
            const fullName = `${customer.firstName} ${customer.lastName}`

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
                            <DropdownMenuItem asChild>
                                <Link href={`/crm/customers/${customer.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.viewDetails")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/crm/customers/${customer.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                </Link>
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
                            <AlertDialogTitle>{t("common.delete")} {t("customers.customer")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("customers.deleteConfirmDescription", {name: fullName})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(customer.id)}
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
