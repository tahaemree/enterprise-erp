"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Mail, Phone, Eye, Pencil, Trash2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { EmployeeStatus, EmployeeStatusBadge } from "@/components/hr/employee-status"
import type { AppTranslator } from "@/lib/i18n-types"

export type Employee = {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    position: string
    department: {
        id: string
        name: string
    }
    status: EmployeeStatus
    hireDate: Date
    salary?: number | null
    avatar?: string | null
}

export const createEmployeeColumns = (t: AppTranslator, onDelete?: (id: string) => void): ColumnDef<Employee>[] => [
    {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.employee")} />
        ),
        cell: ({ row }) => {
            const employee = row.original
            const fullName = `${employee.firstName} ${employee.lastName}`

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatar || undefined} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{fullName}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "position",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.position")} />
        ),
        cell: ({ row }) => {
            const position = row.getValue("position") as string
            return <span className="font-medium">{position}</span>
        },
    },
    {
        accessorKey: "department",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.department")} />
        ),
        cell: ({ row }) => {
            const department = row.original.department
            return (
                <Badge variant="outline">
                    {department.name}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.original.department.id)
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.status")} />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as Employee["status"]
            return <EmployeeStatusBadge status={status} />
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "hireDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.hireDate")} />
        ),
        cell: ({ row }) => {
            const date = row.getValue("hireDate") as Date
            return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
    },
    {
        accessorKey: "salary",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t("employees.salary")} />
        ),
        cell: ({ row }) => {
            const salary = row.getValue("salary") as number | null
            return salary ? (
                <span className="font-medium">{formatCurrency(salary)}/yr</span>
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const employee = row.original
            const fullName = `${employee.firstName} ${employee.lastName}`

            return (
                <AlertDialog>
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
                            <DropdownMenuItem asChild>
                                <Link href={`/hr/employees/${employee.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.viewProfile")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/hr/employees/${employee.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                {t("common.sendEmail")}
                            </DropdownMenuItem>
                            {employee.phone && (
                                <DropdownMenuItem>
                                    <Phone className="mr-2 h-4 w-4" />
                                    {t("common.call")}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("common.delete")} {t("employees.employee")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("common.deleteConfirm", {name: fullName})}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => onDelete?.(employee.id)}
                            >
                                {t("common.delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]
