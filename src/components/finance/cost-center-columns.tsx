"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "@/i18n/navigation"
import type { AppTranslator } from "@/lib/i18n-types"

export type CostCenterRow = {
    id: string
    code: string
    name: string
    description: string | null
    isActive: boolean
}

export function createCostCenterColumns(t: AppTranslator): ColumnDef<CostCenterRow>[] {
    return [
        {
            accessorKey: "code",
            header: t("finance.costCenters.code") || "Code",
            cell: ({ row }) => (
                <div className="font-mono text-sm">{row.getValue("code")}</div>
            ),
        },
        {
            accessorKey: "name",
            header: t("finance.costCenters.name") || "Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "description",
            header: t("finance.costCenters.description") || "Description",
            cell: ({ row }) => {
                const desc = row.getValue("description") as string
                return <div className="text-muted-foreground truncate max-w-[300px]">{desc || "-"}</div>
            },
        },
        {
            accessorKey: "isActive",
            header: t("finance.costCenters.status") || "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean
                return (
                    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                        {isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const center = row.original

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
                            <DropdownMenuItem asChild>
                                <Link href={`/finance/cost-centers/${center.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
}
