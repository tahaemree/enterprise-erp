"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createBaBsColumns, type BaBsForm } from "./ba-bs-columns"

interface BaBsTableProps {
    data: BaBsForm[]
}

export function BaBsTable({ data }: BaBsTableProps) {
    const t = useTranslations("accounting.baBs")
    const columns = createBaBsColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="formType"
            searchPlaceholder="Search BA/BS forms..."
        />
    )
}
