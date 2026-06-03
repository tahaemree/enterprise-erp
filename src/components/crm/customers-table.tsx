"use client"

import { useTranslations } from "next-intl"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { createCustomerColumns, type Customer } from "@/components/crm/customer-columns"
import { deleteCustomer } from "@/lib/actions/customers"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface CustomersTableProps {
    data: Customer[]
    pageCount?: number
    pagination?: { pageIndex: number; pageSize: number }
}

export function CustomersTable({ data, pageCount, pagination }: CustomersTableProps) {
    const t = useTranslations()
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const handleConfirmDelete = () => {
        if (!deleteId) return
        setIsDeleting(true)
        startTransition(async () => {
            try {
                await deleteCustomer({ id: deleteId })
                toast.success(t("common.deleteSuccess"))
                setDeleteId(null)
                router.refresh()
            } catch (_error) {
                toast.error(t("common.deleteError"))
            } finally {
                setIsDeleting(false)
                setDeleteId(null)
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
        params.set("page", "1") // Reset to page 1 on search
        router.push(`${pathname}?${params.toString()}`)
    }

    const columns = createCustomerColumns(t, handleDelete)

    return (
        <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <DataTable
                columns={columns}
                data={data}
                searchKey="firstName"
                searchPlaceholder={t("customers.searchCustomers")}
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
