"use client"

import { DataTable } from "@/components/tables/data-table"
import { createCustomerAccountColumns, type CustomerAccount } from "./customer-account-columns"

interface CustomerAccountsTableProps {
    data: CustomerAccount[]
    onDelete?: (id: string) => void
}

export function CustomerAccountsTable({ data, onDelete }: CustomerAccountsTableProps) {
    const columns = createCustomerAccountColumns(onDelete)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="accountCode"
            searchPlaceholder="Search by account code or customer..."
        />
    )
}
