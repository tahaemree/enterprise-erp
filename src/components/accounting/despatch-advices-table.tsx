"use client"

import { DataTable } from "@/components/tables/data-table"
import { createDespatchAdviceColumns, type DespatchAdvice } from "./despatch-advice-columns"
import { useTranslations } from "next-intl"

interface DespatchAdvicesTableProps {
    data: DespatchAdvice[]
    onDelete?: (id: string) => void
}

export function DespatchAdvicesTable({ data, onDelete }: DespatchAdvicesTableProps) {
    const t = useTranslations()
    const columns = createDespatchAdviceColumns(t, onDelete)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="receiverName"
            searchPlaceholder={t("accounting.despatchAdvice.receiverName")}
        />
    )
}
