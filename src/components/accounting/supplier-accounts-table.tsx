"use client"

import { DataTable } from "@/components/tables/data-table"
import { createSupplierAccountColumns, type SupplierAccount } from "./supplier-account-columns"

interface SupplierAccountsTableProps {
    data: SupplierAccount[]
    onDelete?: (id: string) => void
}

export function SupplierAccountsTable({ data, onDelete }: SupplierAccountsTableProps) {
    const columns = createSupplierAccountColumns(onDelete)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="accountCode"
            searchPlaceholder="Search by account code or supplier..."
        />
    )
}
