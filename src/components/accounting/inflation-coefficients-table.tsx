"use client"

import { DataTable } from "@/components/tables/data-table"
import { inflationCoefficientColumns, type InflationCoefficient } from "./inflation-coefficient-columns"

interface InflationCoefficientsTableProps {
    data: InflationCoefficient[]
}

export function InflationCoefficientsTable({ data }: InflationCoefficientsTableProps) {
    return (
        <DataTable
            columns={inflationCoefficientColumns}
            data={data}
            searchKey="source"
            searchPlaceholder="Search coefficients..."
        />
    )
}
