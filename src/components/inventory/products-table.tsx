"use client"

import { useTranslations } from "next-intl"
import { useTransition, useState } from "react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { createProductColumns, type Product } from "@/components/inventory/product-columns"
import { deleteProduct } from "@/lib/actions/products"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface ProductsTableProps {
    data: Product[]
    pageCount?: number
    currentPage?: number
    pageSize?: number
    searchQuery?: string
}

export function ProductsTable({ data, pageCount, currentPage = 1, pageSize = 10, searchQuery }: ProductsTableProps) {
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
                await deleteProduct({ id: deleteId })
                toast.success(t("common.deleteSuccess"))
                setDeleteId(null)
                router.refresh()
            } catch (error) {
                toast.error(t("common.deleteError"))
            } finally {
                setIsDeleting(false)
                setDeleteId(null)
            }
        })
    }

    const handlePaginationChange = (pagination: { pageIndex: number; pageSize: number }) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", (pagination.pageIndex + 1).toString())
        params.set("pageSize", pagination.pageSize.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleSearchChange = (search: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (search) {
            params.set("search", search)
        } else {
            params.delete("search")
        }
        params.set("page", "1") // reset to first page on search
        router.push(`${pathname}?${params.toString()}`)
    }

    const columns = createProductColumns(t, handleDelete)

    return (
        <>
            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder={t("inventory.products.searchProducts")}
            manualPagination={true}
            manualFiltering={true}
            pageCount={pageCount}
            pagination={{ pageIndex: currentPage - 1, pageSize }}
            onPaginationChange={handlePaginationChange}
            onSearchChange={handleSearchChange}
        />
        </>
    )
}
