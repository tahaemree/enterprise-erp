"use client"

import { DataTable } from "@/components/tables/data-table"
import { createDespatchAdviceColumns, type DespatchAdvice } from "./despatch-advice-columns"

interface DespatchAdvicesTableProps {
    data: DespatchAdvice[]
    onDelete?: (id: string) => void
}

export function DespatchAdvicesTable({ data, onDelete }: DespatchAdvicesTableProps) {
    const columns = createDespatchAdviceColumns(onDelete)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="receiverName"
            searchPlaceholder="Search by receiver name..."
        />
    )
}
