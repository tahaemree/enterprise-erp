"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { useExchangeRateColumns, type ExchangeRate } from "./exchange-rate-columns"

interface ExchangeRatesTableProps {
    data: ExchangeRate[]
}

export function ExchangeRatesTable({ data }: ExchangeRatesTableProps) {
    const t = useTranslations("accounting.exchangeRates.columns")
    const columns = useExchangeRateColumns()
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="source"
            searchPlaceholder={t("search")}
        />
    )
}
