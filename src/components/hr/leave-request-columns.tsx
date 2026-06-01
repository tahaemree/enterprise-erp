"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Check, X, Eye, Clock, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatDate, getInitials } from "@/lib/utils"

export type LeaveRequest = {
    id: string
    employee: {
        id: string
        firstName: string
        lastName: string
        avatar?: string | null
        position: string
        department: string
    }
    type: "VACATION" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "BEREAVEMENT" | "OTHER" | "ANNUAL" | "UNPAID" | "COMPENSATORY"
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "IN_PROGRESS"
    startDate: Date
    endDate: Date
    reason?: string | null
    createdAt: Date
}

const typeConfig: Record<string, { labelKey: string; className: string }> = {
    VACATION: {
        labelKey: "status.VACATION",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    SICK: {
        labelKey: "hr.leave.type_SICK",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    PERSONAL: {
        labelKey: "hr.leave.type_PERSONAL",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
    MATERNITY: {
        labelKey: "leaveRequestForm.type_MATERNITY",
        className: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    },
    PATERNITY: {
        labelKey: "leaveRequestForm.type_PATERNITY",
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    BEREAVEMENT: {
        labelKey: "leaveRequestForm.type_BEREAVEMENT",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    },
    OTHER: {
        labelKey: "leaveRequestForm.type_OTHER",
        className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
    },
    ANNUAL: {
        labelKey: "leaveRequestForm.type_ANNUAL",
        className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    },
    UNPAID: {
        labelKey: "leaveRequestForm.type_UNPAID",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    COMPENSATORY: {
        labelKey: "leaveRequestForm.type_COMPENSATORY",
        className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
}

const statusConfig: Record<string, { labelKey: string; icon: typeof Clock; className: string }> = {
    PENDING: {
        labelKey: "status.PENDING",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    APPROVED: {
        labelKey: "status.APPROVED",
        icon: Check,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    REJECTED: {
        labelKey: "status.REJECTED",
        icon: X,
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    CANCELLED: {
        labelKey: "status.CANCELLED",
        icon: X,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    },
    IN_PROGRESS: {
        labelKey: "status.IN_PROGRESS",
        icon: Clock,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
}

function calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end days
}

export const createLeaveRequestColumns = (t: any): ColumnDef<LeaveRequest>[] => [
    {
        accessorKey: "employee",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.employee")} />
        ),
        cell: ({ row }) => {
            const employee = row.original.employee
            const fullName = `${employee.firstName} ${employee.lastName}`

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatar || undefined} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{fullName}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.type")} />
        ),
        cell: ({ row }) => {
            const type = row.getValue("type") as LeaveRequest["type"]
            const config = typeConfig[type]!

            return (
                <Badge variant="secondary" className={config.className}>
                    {t(config.labelKey)}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "dates",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.dates")} />
        ),
        cell: ({ row }) => {
            const startDate = row.original.startDate
            const endDate = row.original.endDate
            const days = calculateDays(startDate, endDate)

            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm">
                            {formatDate(startDate)} - {formatDate(endDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("hr.leave.days", {count: days})}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as LeaveRequest["status"]
            const config = statusConfig[status]!
            const Icon = config.icon

            return (
                <Badge variant="secondary" className={config.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {t(config.labelKey)}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "reason",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.reason")} />
        ),
        cell: ({ row }) => {
            const reason = row.getValue("reason") as string | null

            return reason ? (
                <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {reason}
                </span>
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("hr.leave.requested")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date
            return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const request = row.original
            const isPending = request.status === "PENDING"

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("common.openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("common.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            {t("common.viewEmployee")}
                        </DropdownMenuItem>
                        {isPending && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600">
                                    <Check className="mr-2 h-4 w-4" />
                                    {t("common.approve")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    <X className="mr-2 h-4 w-4" />
                                    {t("common.reject")}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
