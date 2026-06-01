"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { useCurrencyColumns, type Currency } from "./currency-columns"

interface CurrenciesTableProps {
    data: Currency[]
}

export function CurrenciesTable({ data }: CurrenciesTableProps) {
    const t = useTranslations("accounting.currencies.columns")
    const columns = useCurrencyColumns()
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder={t("search")}
        />
    )
}
