"use client"

import { DataTable } from "@/components/tables/data-table"
import { createEInvoiceColumns, type EInvoice } from "./einvoice-columns"
import { useTranslations } from "next-intl"

interface EInvoicesTableProps {
    data: EInvoice[]
    onDelete?: (id: string) => void
    onSubmit?: (id: string) => void
    onRetry?: (id: string) => void
    onCancel?: (id: string) => void
}

export function EInvoicesTable({ data, onDelete, onSubmit, onRetry, onCancel }: EInvoicesTableProps) {
    const t = useTranslations("eInvoice")
    const columns = createEInvoiceColumns(t, onDelete, onSubmit, onRetry, onCancel)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="receiverName"
            searchPlaceholder={t("searchPlaceholder")}
        />
    )
}
