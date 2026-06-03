"use client"

import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { createTransactionColumns, type Transaction } from "@/components/finance/transaction-columns"
import { deleteTransaction } from "@/lib/actions/transactions"

interface TransactionsTableProps {
    data: Transaction[]
    pageCount?: number
    pagination?: { pageIndex: number; pageSize: number }
}

export function TransactionsTable({ data, pageCount, pagination }: TransactionsTableProps) {
    const t = useTranslations()
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteTransaction({ id })
                toast.success(t("common.deleteSuccess"))
                router.refresh()
            } catch (_error) {
                toast.error(t("common.deleteError"))
            }
        })
    }

    const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", (newPagination.pageIndex + 1).toString())
        params.set("limit", newPagination.pageSize.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleSearchChange = (search: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (search) {
            params.set("search", search)
        } else {
            params.delete("search")
        }
        params.set("page", "1")
        router.push(`${pathname}?${params.toString()}`)
    }

    const columns = createTransactionColumns(t, handleDelete)

    return (
        <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
            <DataTable
                columns={columns}
                data={data}
                searchKey="description"
                searchPlaceholder={t("finance.transactions.searchTransactions")}
                manualPagination={true}
                manualFiltering={true}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onSearchChange={handleSearchChange}
            />
        </div>
    )
}
