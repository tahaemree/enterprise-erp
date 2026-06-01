"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import {
    createCheckNoteColumns,
    type CheckNoteRow,
} from "@/components/finance/check-note-columns"

interface CheckNotesTableProps {
    data: CheckNoteRow[]
}

export function CheckNotesTable({ data }: CheckNotesTableProps) {
    const t = useTranslations()
    const columns = createCheckNoteColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="issuerName"
            searchPlaceholder={t("accounting.checkNote.search")}
        />
    )
}
