import { Link } from "@/i18n/navigation"
import { Plus, FileText, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { AccountEntry } from "@/components/accounting/account-entry-columns"
import { AccountEntriesTable } from "@/components/accounting/account-entries-table"
import { getAccountEntries } from "@/lib/actions/tr-accounting"

export default async function AccountEntriesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.accountEntries")
    const entriesData = await getAccountEntries()

    const entries: AccountEntry[] = entriesData.map((e) => ({
        id: e.id,
        entryNumber: e.entryNumber,
        entryType: e.entryType as AccountEntry["entryType"],
        description: e.description,
        entryDate: e.entryDate,
        lines: e.lines.map((l) => ({
            id: l.id,
            side: l.side as "DEBIT" | "CREDIT",
            amount: l.amount,
            description: l.description,
        })),
        createdAt: e.createdAt,
    }))

    const totalDebit = entries.reduce(
        (sum, e) => sum + e.lines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0),
        0
    )
    const totalCredit = entries.reduce(
        (sum, e) => sum + e.lines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0),
        0
    )
    const debitNotes = entries.filter((e) => e.entryType === "DEBIT_NOTE").length
    const creditNotes = entries.filter((e) => e.entryType === "CREDIT_NOTE").length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <Button asChild>
                    <Link href="/accounting/entries/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addEntry")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalEntries")}</p>
                            <p className="text-2xl font-bold">{entries.length}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("debitNotes")}</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{debitNotes}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("creditNotes")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{creditNotes}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalDebit")}</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalDebit)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <AccountEntriesTable data={entries} />
            </div>
        </div>
    )
}
