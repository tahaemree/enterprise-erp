"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, FileText, Truck, XCircle, Trash2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

export type Order = {
    id: string
    orderNumber: string
    customer: {
        id: string
        firstName: string
        lastName: string
        company?: string
    }
    status: "DRAFT" | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "ON_HOLD"
    total: number
    itemCount: number
    paymentStatus: string
    createdAt: Date
}

const statusConfig: Record<string, { color: string; labelKey: string }> = {
    DRAFT: { color: "bg-gray-100 text-gray-800", labelKey: "status.DRAFT" },
    PENDING: { color: "bg-yellow-100 text-yellow-800", labelKey: "status.PENDING" },
    CONFIRMED: { color: "bg-blue-100 text-blue-800", labelKey: "status.CONFIRMED" },
    PROCESSING: { color: "bg-purple-100 text-purple-800", labelKey: "status.PROCESSING" },
    ON_HOLD: { color: "bg-orange-100 text-orange-800", labelKey: "status.ON_HOLD" },
    SHIPPED: { color: "bg-indigo-100 text-indigo-800", labelKey: "status.SHIPPED" },
    DELIVERED: { color: "bg-green-100 text-green-800", labelKey: "status.DELIVERED" },
    COMPLETED: { color: "bg-emerald-100 text-emerald-800", labelKey: "status.COMPLETED" },
    CANCELLED: { color: "bg-red-100 text-red-800", labelKey: "status.CANCELLED" },
    REFUNDED: { color: "bg-orange-100 text-orange-800", labelKey: "status.REFUNDED" },
}

const paymentStatusConfig: Record<string, { color: string; labelKey: string }> = {
    unpaid: { color: "destructive", labelKey: "finance.orders.unpaid" },
    partial: { color: "secondary", labelKey: "finance.orders.partial" },
    paid: { color: "default", labelKey: "finance.orders.paid" },
    refunded: { color: "outline", labelKey: "finance.orders.refunded" },
}

export const createOrderColumns = (t: any, onDelete?: (id: string) => void): ColumnDef<Order>[] => [
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
        accessorKey: "orderNumber",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.order")} />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <span className="font-mono font-medium">{row.getValue("orderNumber")}</span>
                    <span className="text-xs text-muted-foreground">
                        {t("finance.orders.items", {count: row.original.itemCount})}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "customer",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.customer")} />
        ),
        cell: ({ row }) => {
            const customer = row.original.customer
            return (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {customer.firstName} {customer.lastName}
                    </span>
                    {customer.company && (
                        <span className="text-xs text-muted-foreground">{customer.company}</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const config = statusConfig[status]!
            return (                    <Badge className={config.color} variant="outline">
                        {t(config.labelKey)}
                    </Badge>
            )
        },
    },
    {
        accessorKey: "paymentStatus",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.payment")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("paymentStatus") as string
            const config = paymentStatusConfig[status]!
            return (                    <Badge variant={config.color as "default" | "secondary" | "destructive" | "outline"}>
                        {t(config.labelKey)}
                    </Badge>
            )
        },
    },
    {
        accessorKey: "total",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.total")} />
        ),
        cell: ({ row }) => {
            return (
                <span className="font-medium">{formatCurrency(row.getValue("total"))}</span>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("finance.orders.date")} />
        ),
        cell: ({ row }) => {
            return (
                <span className="text-muted-foreground">
                    {formatDate(row.getValue("createdAt"))}
                </span>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original

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
                                <Link href={`/finance/orders/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.viewDetails")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/finance/invoices/${order.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t("common.generateInvoice")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                {t("common.updateStatus")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")} {t("finance.orders.order")}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("common.delete")} {t("finance.orders.order")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: order.orderNumber})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(order.id)}
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
