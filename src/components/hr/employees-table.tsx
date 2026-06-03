"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ListFilter } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/tables/data-table"
import { createEmployeeColumns, type Employee } from "@/components/hr/employee-columns"
import { EMPLOYEE_STATUS_OPTIONS } from "@/components/hr/employee-status"
import { deleteEmployee } from "@/lib/actions/employees"

interface EmployeesTableProps {
    data: Employee[]
    pageCount?: number
    pagination?: { pageIndex: number; pageSize: number }
}

export function EmployeesTable({ data, pageCount, pagination }: EmployeesTableProps) {
    const t = useTranslations()
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [statusFilter, setStatusFilter] = useState<string[]>([])

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
                await deleteEmployee({ id: deleteId })
                toast.success(t("employees.deleteSuccess"))
                setDeleteId(null)
                router.refresh()
            } catch (_error) {
                toast.error(t("employees.deleteError"))
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
        params.set("page", "1")
        router.push(`${pathname}?${params.toString()}`)
    }

    const columns = createEmployeeColumns(t, handleDelete)

    // Apply status filter at the data level (simpler than threading through table state)
    const filteredData =
        statusFilter.length > 0
            ? data.filter((emp) => statusFilter.includes(emp.status))
            : data

    const statusToolbar = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                    <ListFilter className="mr-2 h-4 w-4" />
                    {t("employees.status")}
                    {statusFilter.length > 0 && (
                        <span className="ml-1.5 rounded-md bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            {statusFilter.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{t("employees.filterByStatus")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EMPLOYEE_STATUS_OPTIONS.map((option) => {
                    const isSelected = statusFilter.includes(option.value)
                    return (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                                setStatusFilter((prev) =>
                                    checked
                                        ? [...prev, option.value]
                                        : prev.filter((s) => s !== option.value)
                                )
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "inline-block h-2 w-2 rounded-full",
                                        option.value === "ACTIVE" && "bg-green-500",
                                        option.value === "ON_LEAVE" && "bg-yellow-500",
                                        option.value === "SUSPENDED" && "bg-orange-500",
                                        option.value === "PROBATION" && "bg-blue-500",
                                        option.value === "TERMINATED" && "bg-red-500"
                                    )}
                                />
                                {t("status." + option.labelKey)}
                            </span>
                        </DropdownMenuCheckboxItem>
                    )
                })}
                {statusFilter.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-xs"
                            onClick={() => setStatusFilter([])}
                        >
                            {t("employees.clearFilter")}
                        </Button>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <>
            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null) }}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    searchKey="name"
                    searchPlaceholder={t("employees.searchEmployees")}
                    toolbar={statusToolbar}
                    manualPagination={true}
                    manualFiltering={true}
                    pageCount={pageCount}
                    pagination={pagination}
                    onPaginationChange={handlePaginationChange}
                    onSearchChange={handleSearchChange}
                />
            </div>
        </>
    )
}
