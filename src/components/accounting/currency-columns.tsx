"use client"

import { useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export interface Currency {
    id: string
    code: string
    name: string
    symbol: string
    isDefault: boolean
    isActive: boolean
    createdAt: Date
}

export function useCurrencyColumns(): ColumnDef<Currency>[] {
    const t = useTranslations("accounting.currencies.columns")
    return [
    {
        accessorKey: "code",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("code")} />
        ),
        cell: ({ row }) => (
            <span className="font-mono font-bold uppercase">{row.getValue("code")}</span>
        ),
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("name")} />
        ),
        cell: ({ row }) => (
            <span>{row.getValue("name")}</span>
        ),
    },
    {
        accessorKey: "symbol",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("symbol")} />
        ),
        cell: ({ row }) => (
            <span className="text-lg">{row.getValue("symbol")}</span>
        ),
    },
    {
        accessorKey: "isDefault",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("default")} />
        ),
        cell: ({ row }) => {
            const isDefault = row.getValue("isDefault")
            return isDefault ? (                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">{t("default")}</Badge>
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        },
    },
    {
        accessorKey: "isActive",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("status")} />
        ),
        cell: ({ row }) => {
            const isActive = row.getValue("isActive")
            return isActive ? (
                <Badge variant="outline" className="border-emerald-500 text-emerald-600">{t("active")}</Badge>
            ) : (
                <Badge variant="outline" className="border-destructive text-destructive">{t("inactive")}</Badge>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("created")} />
        ),
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
]
}
