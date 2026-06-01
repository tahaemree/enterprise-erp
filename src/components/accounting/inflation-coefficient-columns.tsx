"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"

export interface InflationCoefficient {
    id: string
    year: number
    month: number
    coefficient: number
    ppi: number | null
    source: string | null
    notes: string | null
    createdAt: Date
}

const t = (key: string) => {
    const translations: Record<string, string> = {
        "period": "Period",
        "coefficient": "Coefficient",
        "ppi": "PPI (Yİ-ÜFE)",
        "source": "Source",
        "created": "Created",
    }
    return translations[key] || key
}

export const inflationCoefficientColumns: ColumnDef<InflationCoefficient>[] = [
    {
        id: "period",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("period")} />
        ),
        cell: ({ row }) => {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            return (
                <span className="font-medium">
                    {months[row.original.month - 1]} {row.original.year}
                </span>
            )
        },
    },
    {
        accessorKey: "coefficient",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("coefficient")} />
        ),
        cell: ({ row }) => (
            <span className="font-mono font-medium">
                {Number(row.getValue("coefficient")).toFixed(6)}
            </span>
        ),
    },
    {
        accessorKey: "ppi",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("ppi")} />
        ),
        cell: ({ row }) => {
            const ppi = row.getValue("ppi")
            return ppi !== null && ppi !== undefined
                ? <span className="font-mono">{Number(ppi).toFixed(2)}</span>
                : <span className="text-muted-foreground">—</span>
        },
    },
    {
        accessorKey: "source",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("source")} />
        ),
        cell: ({ row }) => {
            const source = row.getValue("source")
            return source
                ? <span className="text-sm">{source as string}</span>
                : <span className="text-muted-foreground">—</span>
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
