"use client"

import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { createOrderColumns, type Order } from "@/components/finance/order-columns"
import { deleteOrder } from "@/lib/actions/orders"

interface OrdersTableProps {
    data: Order[]
    pageCount?: number
    pagination?: { pageIndex: number; pageSize: number }
}

export function OrdersTable({ data, pageCount, pagination }: OrdersTableProps) {
    const t = useTranslations()
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteOrder({ id })
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

    const columns = createOrderColumns(t, handleDelete)

    return (
        <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
            <DataTable
                columns={columns}
                data={data}
                searchKey="orderNumber"
                searchPlaceholder={t("finance.orders.searchOrders")}
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
