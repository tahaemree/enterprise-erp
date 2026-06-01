"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
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
import { formatCurrency, getStockStatus, cn } from "@/lib/utils"

export type Product = {
    id: string
    name: string
    sku: string
    price: number
    costPrice?: number
    quantity: number
    minStock: number
    unit: string
    isActive: boolean
    category?: {
        id: string
        name: string
    }
    supplier?: {
        id: string
        name: string
    }
    createdAt: Date
}

export const createProductColumns = (t: any, onDelete?: (id: string) => void): ColumnDef<Product>[] => [
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
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.products.product")} />
        ),
        cell: ({ row }) => {
            const product = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "category",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.products.category")} />
        ),
        cell: ({ row }) => {
            const category = row.original.category
            return category ? (
                <Badge variant="outline">{category.name}</Badge>
            ) : (
                <span className="text-muted-foreground">-</span>
            )
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.products.price")} />
        ),
        cell: ({ row }) => {
            const price = row.getValue("price") as number
            return <span className="font-medium">{formatCurrency(price)}</span>
        },
    },
    {
        accessorKey: "quantity",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.products.quantity")} />
        ),
        cell: ({ row }) => {
            const product = row.original
            const status = getStockStatus(product.quantity, product.minStock)

            return (
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "font-medium",
                            status === "out-of-stock" && "text-destructive",
                            status === "low-stock" && "text-yellow-600"
                        )}
                    >
                        {product.quantity}
                    </span>
                    <span className="text-muted-foreground text-xs">{product.unit}</span>
                    {status === "low-stock" && (
                        <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">
                            {t("common.low")}
                        </Badge>
                    )}
                    {status === "out-of-stock" && (
                        <Badge variant="destructive">{t("common.out")}</Badge>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "supplier",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.suppliers.supplier")} />
        ),
        cell: ({ row }) => {
            const supplier = row.original.supplier
            return supplier ? (
                <span>{supplier.name}</span>
            ) : (
                <span className="text-muted-foreground">-</span>
            )
        },
    },
    {
        accessorKey: "isActive",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.products.status")} />
        ),
        cell: ({ row }) => {
            const isActive = row.getValue("isActive") as boolean
            return (
                <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? t("common.active") : t("common.inactive")}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const product = row.original

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
                                <Link href={`/inventory/products/${product.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.viewDetails")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/inventory/products/${product.id}/edit`}>
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
                            <AlertDialogTitle>{t("common.delete")} {t("inventory.products.product")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: product.name})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(product.id)}
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
