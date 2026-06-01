"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createInvoiceColumns, type Invoice } from "@/components/finance/invoice-columns"

interface InvoicesTableProps {
    data: Invoice[]
    searchPlaceholder: string
}

export function InvoicesTable({ data, searchPlaceholder }: InvoicesTableProps) {
    const t = useTranslations()
    const columns = createInvoiceColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="invoiceNumber"
            searchPlaceholder={searchPlaceholder}
        />
    )
}
