"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import {
    createBankAccountColumns,
    type BankAccountRow,
} from "@/components/finance/bank-account-columns"

interface BankAccountsTableProps {
    data: BankAccountRow[]
}

export function BankAccountsTable({ data }: BankAccountsTableProps) {
    const t = useTranslations()
    const columns = createBankAccountColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="bankName"
            searchPlaceholder={t("accounting.bankAccounts.search")}
        />
    )
}
