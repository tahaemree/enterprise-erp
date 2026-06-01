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
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

export type CheckNoteRow = {
    id: string
    type: string
    direction: string
    serialNumber: string
    issuerName: string
    amount: number
    currency: string
    maturityDate: Date
    status: string
}

export function createCheckNoteColumns(t: any): ColumnDef<CheckNoteRow>[] {
    return [
        {
            accessorKey: "type",
            header: t("finance.checkNote.type") || "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string
                return (
                    <Badge variant={type === "CHECK" ? "default" : "secondary"}>
                        {type === "CHECK" ? t("finance.checkNote.check") : t("finance.checkNote.promissoryNote")}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "serialNumber",
            header: t("finance.checkNote.serialNo") || "Serial No",
            cell: ({ row }) => (
                <div className="font-mono text-sm">{row.getValue("serialNumber")}</div>
            ),
        },
        {
            accessorKey: "issuerName",
            header: t("finance.checkNote.issuerPayee") || "Issuer / Payee",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("issuerName")}</div>
            ),
        },
        {
            accessorKey: "maturityDate",
            header: t("finance.checkNote.maturityDate") || "Maturity Date",
            cell: ({ row }) => {
                const date = row.getValue("maturityDate") as Date
                return <div>{format(new Date(date), "dd MMM yyyy")}</div>
            },
        },
        {
            accessorKey: "amount",
            header: t("finance.checkNote.amount") || "Amount",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"))
                const currency = row.original.currency
                return <div className="font-medium text-right">{formatCurrency(amount, currency)}</div>
            },
        },
        {
            accessorKey: "status",
            header: t("finance.checkNote.status") || "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const getVariant = (s: string) => {
                    if (s === "COLLECTED") return "default"
                    if (s === "BOUNCED") return "destructive"
                    return "secondary"
                }
                const getClassName = (s: string) => {
                    if (s === "COLLECTED") return "bg-emerald-500 hover:bg-emerald-600 capitalize"
                    return "capitalize"
                }
                return (
                    <Badge variant={getVariant(status) as "default" | "secondary" | "destructive" | "outline"} className={getClassName(status)}>
                        {status.replace("_", " ").toLowerCase()}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const note = row.original

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
                                <Link href={`/finance/check-notes/${note.id}`}>
                                    {t("common.viewDetails")}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/finance/check-notes/${note.id}/edit`}>
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
