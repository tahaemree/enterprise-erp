"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createCostCenterColumns, type CostCenterRow } from "@/components/finance/cost-center-columns"

interface CostCentersTableProps {
    data: CostCenterRow[]
    searchPlaceholder: string
}

export function CostCentersTable({ data, searchPlaceholder }: CostCentersTableProps) {
    const t = useTranslations()
    const columns = createCostCenterColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder={searchPlaceholder}
        />
    )
}
