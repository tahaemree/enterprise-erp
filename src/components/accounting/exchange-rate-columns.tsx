"use client"

import { useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatDate } from "@/lib/utils"

export interface ExchangeRate {
    id: string
    fromCurrency: { code: string; name: string; symbol: string }
    toCurrency: { code: string; name: string; symbol: string }
    rate: number
    date: Date
    source: string | null
    createdAt: Date
}

export function useExchangeRateColumns(): ColumnDef<ExchangeRate>[] {
    const t = useTranslations("accounting.exchangeRates.columns")
    return [
    {
        id: "pair",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("pair")} />
        ),
        cell: ({ row }) => {
            const r = row.original
            return (
                <span className="font-mono font-medium">
                    {r.fromCurrency.code} → {r.toCurrency.code}
                </span>
            )
        },
    },
    {
        id: "rate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("rate")} />
        ),
        cell: ({ row }) => {
            const r = row.original
            return (
                <span className="font-mono font-bold tabular-nums">
                    {r.rate.toFixed(6)}
                </span>
            )
        },
    },
    {
        accessorKey: "date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("date")} />
        ),
        cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
        accessorKey: "source",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("source")} />
        ),
        cell: ({ row }) => {
            const source = row.getValue("source") as string | null
            return source ? (
                <span className="text-sm">{source}</span>
            ) : (
                <span className="text-muted-foreground">MANUAL</span>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("recorded")} />
        ),
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
]
}
