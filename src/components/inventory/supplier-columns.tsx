"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone } from "lucide-react"
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

export type Supplier = {
    id: string
    name: string
    contactName?: string
    email?: string
    phone?: string
    city?: string
    country?: string
    isActive: boolean
    productCount: number
}

type TranslateFn = (key: string, params?: Record<string, string | number | Date>) => string

export const createSupplierColumns = (t: TranslateFn, onDelete?: (id: string) => void): ColumnDef<Supplier>[] => [
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
            <DataTableColumnHeader column={column} title={t("inventory.suppliers.supplier")} />
        ),
        cell: ({ row }) => {
            const supplier = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{supplier.name}</span>
                    {supplier.contactName && (
                        <span className="text-xs text-muted-foreground">
                            {supplier.contactName}
                        </span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.suppliers.contact")} />
        ),
        cell: ({ row }) => {
            const supplier = row.original
            return (
                <div className="flex flex-col gap-1">
                    {supplier.email && (
                        <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{supplier.email}</span>
                        </div>
                    )}
                    {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                        </div>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "city",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.suppliers.location")} />
        ),
        cell: ({ row }) => {
            const supplier = row.original
            if (!supplier.city && !supplier.country) {
                return <span className="text-muted-foreground">-</span>
            }
            return (
                <span>
                    {[supplier.city, supplier.country].filter(Boolean).join(", ")}
                </span>
            )
        },
    },
    {
        accessorKey: "productCount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("inventory.suppliers.products")} />
        ),
        cell: ({ row }) => {
            return (
                <Badge variant="secondary">{row.getValue("productCount")} {t("inventory.products.product")}</Badge>
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
            const supplier = row.original

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
                                <Link href={`/inventory/suppliers/${supplier.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.viewDetails")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/inventory/suppliers/${supplier.id}/edit`}>
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
                            <AlertDialogTitle>{t("common.delete")} {t("inventory.suppliers.supplier")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: supplier.name})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(supplier.id)}
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
