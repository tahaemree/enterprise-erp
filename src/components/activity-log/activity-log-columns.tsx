/**
 * Deftra — Activity Log Table Columns
 *
 * TanStack React Table column definitions for the Activity Log data table.
 */

"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { ActivityLog } from "@prisma/client"
import { formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"

// Extended type that includes the user relation
export interface ActivityLogRow {
    id: string
    action: string
    entityType: string
    entityId: string | null
    description: string
    metadata: Record<string, unknown> | null
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string | null
    } | null
}

// Action badge color mapping
const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    UPDATE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
    APPROVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    REJECT: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
    SUBMIT: "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20",
    CANCEL: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
    SEND: "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20",
    LOGIN: "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20",
    LOGOUT: "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20",
    EXPORT: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20",
    IMPORT: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20",
    ARCHIVE: "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20",
    RESTORE: "bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20",
    VIEW: "bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20",
}

// Entity type color mapping (lighter semantic colors)
const entityColors: Record<string, string> = {
    PRODUCT: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    CATEGORY: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    SUPPLIER: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    CUSTOMER: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    ORDER: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    INVOICE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    TRANSACTION: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    BANK_ACCOUNT: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    CHECK_NOTE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    COSTCENTER: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    EMPLOYEE: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    DEPARTMENT: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    LEAVEREQUEST: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
    USER: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    SETTING: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    INVENTORY: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
}

function formatEntityType(entityType: string): string {
    return entityType.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function createActivityLogColumns(t: any): ColumnDef<ActivityLogRow>[] {
    return [
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("activityLog.date")} />
            ),
            cell: ({ row }) => {
                const date = row.original.createdAt
                return (
                    <div className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(date)}
                    </div>
                )
            },
            enableSorting: true,
        },
        {
            accessorKey: "action",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("activityLog.action")} />
            ),
            cell: ({ row }) => {
                const action = row.original.action
                const color = actionColors[action] ?? "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                return (
                    <Badge variant="secondary" className={`font-medium ${color}`}>
                        {action}
                    </Badge>
                )
            },
            filterFn: (row, id, value: string[]) => {
                return value.includes(row.getValue(id))
            },
            enableSorting: true,
        },
        {
            accessorKey: "entityType",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("activityLog.entityType")} />
            ),
            cell: ({ row }) => {
                const entityType = row.original.entityType
                const lookupKey = entityType.toUpperCase().replace(/_/g, "")
                const color = entityColors[lookupKey] ?? "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                return (
                    <Badge variant="outline" className={`font-medium ${color}`}>
                        {formatEntityType(entityType)}
                    </Badge>
                )
            },
            filterFn: (row, id, value: string[]) => {
                return value.includes(row.getValue(id))
            },
            enableSorting: true,
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t.has("columns.description") ? t("columns.description") : "Açıklama"} />
            ),
            cell: ({ row }) => {
                return (
                    <div className="max-w-md truncate text-sm">
                        {row.original.description}
                    </div>
                )
            },
            enableSorting: false,
        },
        {
            accessorKey: "user",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t("activityLog.user")} />
            ),
            cell: ({ row }) => {
                const user = row.original.user
                return (
                    <div className="text-sm text-muted-foreground">
                        {user?.name ?? user?.email ?? "—"}
                    </div>
                )
            },
            enableSorting: false,
        },
    ]
}
