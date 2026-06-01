"use client"

import { DataTable } from "@/components/tables/data-table"
import { createAccountEntryColumns, type AccountEntry } from "./account-entry-columns"

interface AccountEntriesTableProps {
    data: AccountEntry[]
    onDelete?: (id: string) => void
}

export function AccountEntriesTable({ data, onDelete }: AccountEntriesTableProps) {
    const columns = createAccountEntryColumns(onDelete)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="entryNumber"
            searchPlaceholder="Search by entry number or description..."
        />
    )
}
