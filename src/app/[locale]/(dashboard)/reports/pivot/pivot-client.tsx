"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { PivotTable } from "@/components/reporting/pivot-table"
import { formatCurrency } from "@/lib/utils"

export type SalesData = {
    id: string
    customerName: string
    categoryName: string
    productName: string
    status: string
    quantity: number
    total: number
}

const columns: ColumnDef<SalesData>[] = [
    {
        accessorKey: "categoryName",
        header: "Kategori",
        enableGrouping: true,
    },
    {
        accessorKey: "customerName",
        header: "Müşteri",
        enableGrouping: true,
    },
    {
        accessorKey: "productName",
        header: "Ürün",
        enableGrouping: true,
    },
    {
        accessorKey: "status",
        header: "Sipariş Durumu",
        enableGrouping: true,
    },
    {
        accessorKey: "quantity",
        header: "Miktar",
        aggregationFn: "sum",
        aggregatedCell: ({ getValue }) => <span className="font-bold">{getValue() as number} Adet</span>,
    },
    {
        accessorKey: "total",
        header: "Toplam Ciro",
        aggregationFn: "sum",
        aggregatedCell: ({ getValue }) => <span className="font-bold text-green-600">{formatCurrency(getValue() as number)}</span>,
        cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
]

export function PivotClientWrapper({ data }: { data: SalesData[] }) {
    return (
        <PivotTable 
            data={data} 
            columns={columns} 
            initialGrouping={["categoryName"]} 
        />
    )
}
