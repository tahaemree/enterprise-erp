"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createTaxTypeColumns, type TaxType } from "./tax-type-columns"

interface TaxTypesTableProps {
    data: TaxType[]
}

export function TaxTypesTable({ data }: TaxTypesTableProps) {
    const t = useTranslations("accounting.taxTypes")
    const columns = createTaxTypeColumns(t)
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder={t("searchPlaceholder")}
        />
    )
}
