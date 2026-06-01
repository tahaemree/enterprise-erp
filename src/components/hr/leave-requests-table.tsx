"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createLeaveRequestColumns, type LeaveRequest } from "@/components/hr/leave-request-columns"

interface LeaveRequestsTableProps {
    data: LeaveRequest[]
    searchPlaceholder: string
}

export function LeaveRequestsTable({ data, searchPlaceholder }: LeaveRequestsTableProps) {
    const t = useTranslations()
    const columns = createLeaveRequestColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="reason"
            searchPlaceholder={searchPlaceholder}
        />
    )
}
