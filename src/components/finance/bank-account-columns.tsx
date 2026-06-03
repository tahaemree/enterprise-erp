"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
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

export type BankAccountRow = {
    id: string
    bankName: string
    accountNumber: string
    iban: string
    accountType: string
    currency: string
    balance: number
    isActive: boolean
}

export function createBankAccountColumns(t: AppTranslator): ColumnDef<BankAccountRow>[] {
    return [
        {
            accessorKey: "bankName",
            header: t("finance.bankAccounts.bankName") || "Bank Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("bankName")}</div>
            ),
        },
        {
            accessorKey: "accountNumber",
            header: t("finance.bankAccounts.accountNumber") || "Account No",
        },
        {
            accessorKey: "iban",
            header: t("common.iban") || "IBAN",
            cell: ({ row }) => {
                const iban = row.getValue("iban") as string
                // Mask IBAN slightly for UI if needed, but since it's already decrypted we just show it.
                // e.g. TR** **** **** **** **** **** **
                const masked = iban.length > 6 ? `${iban.substring(0, 4)} **** **** **** **** ${iban.substring(iban.length - 4)}` : iban
                return <div className="font-medium tracking-tight tabular-nums text-muted-foreground">{masked}</div>
            }
        },
        {
            accessorKey: "accountType",
            header: t("finance.bankAccounts.accountType") || "Type",
            cell: ({ row }) => {
                const type = row.getValue("accountType") as string
                let translated = type.replace("_", " ").toLowerCase()
                try {
                    translated = t(`bankAccountForm.accountType${type}`)
                } catch (_e) {
                    // Fallback to basic string manipulation if key is missing
                }
                return (
                    <Badge variant="outline" className="capitalize">
                        {translated}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "balance",
            header: t("finance.bankAccounts.balance") || "Balance",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("balance"))
                const currency = row.original.currency
                return <div className="font-medium text-right">{formatCurrency(amount, currency)}</div>
            },
        },
        {
            accessorKey: "isActive",
            header: t("finance.bankAccounts.status") || "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean
                return (
                    <Badge variant="outline" className={isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                        {isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const account = row.original

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
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(account.iban)}
                            >
                                {t("common.copyIban")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/finance/bank-accounts/${account.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("common.editAccount")}
                                </Link>
                            </DropdownMenuItem>
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
