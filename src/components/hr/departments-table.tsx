"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { UserCircle } from "lucide-react"
import { DataTable } from "@/components/tables/data-table"

export type DepartmentRow = {
    id: string
    name: string
    description: string | null
    employeeCount: number
    budget: number | null
    manager: { firstName: string; lastName: string } | null
}

interface DepartmentsTableProps {
    data: DepartmentRow[]
    searchPlaceholder: string
}

export function DepartmentsTable({ data, searchPlaceholder }: DepartmentsTableProps) {
    const t = useTranslations("hr.departments")

    const columns: ColumnDef<DepartmentRow>[] = [
        {
            accessorKey: "name",
            header: t("name") || "Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "description",
            header: t("description") || "Description",
            cell: ({ row }) => (
                <div className="text-muted-foreground truncate max-w-[300px]">
                    {row.getValue("description") || "—"}
                </div>
            ),
        },
        {
            accessorKey: "employeeCount",
            header: t("employees") || "Employees",
            cell: ({ row }) => (
                <div className="font-mono text-sm">{row.getValue("employeeCount")}</div>
            ),
        },
        {
            accessorKey: "budget",
            header: t("budget") || "Budget",
            cell: ({ row }) => {
                const budget = row.getValue("budget")
                return budget
                    ? <div className="font-mono">${Number(budget).toLocaleString()}</div>
                    : <div className="text-muted-foreground">—</div>
            },
        },
        {
            accessorKey: "manager",
            header: t("manager") || "Manager",
            cell: ({ row }) => {
                const manager = row.getValue("manager") as { firstName: string; lastName: string } | null
                return manager
                    ? <div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-muted-foreground" />{manager.firstName} {manager.lastName}</div>
                    : <span className="text-muted-foreground">—</span>
            },
        },
    ]

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder={searchPlaceholder}
        />
    )
}
