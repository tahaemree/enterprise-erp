"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatDate } from "@/lib/utils"

export interface TaxType {
    id: string
    code: string
    name: string
    rate: number
    category: "VAT" | "WITHHOLDING" | "STOPAJ" | "SPECIAL"
    description: string | null
    isActive: boolean
    createdAt: Date
}

const categoryConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    VAT: { label: "KDV", variant: "default" },
    WITHHOLDING: { label: "Tevkifat", variant: "secondary" },
    STOPAJ: { label: "Stopaj", variant: "destructive" },
    SPECIAL: { label: "Özel", variant: "outline" },
}

export function createTaxTypeColumns(t: (key: string) => string): ColumnDef<TaxType>[] {
    return [
        {
            accessorKey: "code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("code")} />
            ),
            cell: ({ row }) => (
                <span className="font-mono text-sm font-medium">{row.getValue("code")}</span>
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("name")} />
            ),
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue("name")}</span>
            ),
        },
        {
            accessorKey: "rate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("rate")} />
            ),
            cell: ({ row }) => (
                <span className="font-mono">{Number(row.getValue("rate")).toFixed(2)}%</span>
            ),
        },
        {
            accessorKey: "category",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("category")} />
            ),
            cell: ({ row }) => {
                const category = row.getValue("category") as keyof typeof categoryConfig
                const config = categoryConfig[category] || { variant: "outline" as const, label: category }
                
                let label = config.label
                try {
                    label = t(`status.${category}`)
                } catch (_e) {
                    // fallback to config label
                }
                
                return <Badge variant={config.variant}>{label}</Badge>
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: "isActive",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("status")} />
            ),
            cell: ({ row }) => {
                const isActive = row.getValue("isActive")
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? t("active") : t("inactive")}
                    </Badge>
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
