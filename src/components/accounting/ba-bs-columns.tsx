"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { AppTranslator } from "@/lib/i18n-types"

export interface BaBsForm {
    id: string
    formType: "BA" | "BS"
    year: number
    month: number
    status: "DRAFT" | "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED"
    xmlContent: string | null
    submittedAt: Date | null
    createdAt: Date
    items: Array<{
        id: string
        taxId: string
        name: string
        documentCount: number
        totalAmount: number
    }>
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    PENDING: { label: "Pending", variant: "outline" },
    SUBMITTED: { label: "Submitted", variant: "default" },
    ACCEPTED: { label: "Accepted", variant: "default" },
    REJECTED: { label: "Rejected", variant: "destructive" },
}

export const createBaBsColumns = (t: AppTranslator): ColumnDef<BaBsForm>[] => [
    {
        accessorKey: "formType",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("type")} />
        ),
        cell: ({ row }) => {
            const type = row.getValue("formType") as string
            return (
                <Badge variant={type === "BA" ? "default" : "secondary"}>
                    {type === "BA" ? "BA (Purchases)" : "BS (Sales)"}
                </Badge>
            )
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
        id: "period",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("period")} />
        ),
        cell: ({ row }) => {
            const year = row.original.year
            const month = row.original.month
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            return (
                <span className="font-medium">
                    {months[month - 1]} {year}
                </span>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as keyof typeof statusConfig
            const config = statusConfig[status] || { variant: "outline" as const }
            const label = t.has?.(`status.${status}`) ? t(`status.${status}`) : status
            return <Badge variant={config.variant}>{label}</Badge>
        },
    },
    {
        id: "totalDocuments",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("documents")} />
        ),
        cell: ({ row }) => {
            const total = row.original.items.reduce((sum, i) => sum + i.documentCount, 0)
            return <span className="font-mono">{total}</span>
        },
    },
    {
        id: "totalAmount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("totalAmount")} />
        ),
        cell: ({ row }) => {
            const total = row.original.items.reduce((sum, i) => sum + Number(i.totalAmount), 0)
            return <span className="font-mono font-medium">{formatCurrency(total, "TRY", "tr-TR")}</span>
        },
    },
    {
        id: "submittedAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("submitted")} />
        ),
        cell: ({ row }) => {
            const date = row.original.submittedAt
            return date ? formatDate(date) : <span className="text-muted-foreground">—</span>
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
