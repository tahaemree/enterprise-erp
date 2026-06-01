import { Link } from "@/i18n/navigation"
import { Plus, ScrollText, CheckSquare, XSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import type { CheckNoteRow } from "@/components/finance/check-note-columns"
import { CheckNotesTable } from "@/components/finance/check-notes-table"
import { getCheckNotes } from "@/lib/actions/check-notes"
import { formatCurrency } from "@/lib/utils"

export default async function CheckNotesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    const notesData = await getCheckNotes()

    const checkNotes: CheckNoteRow[] = notesData.map(n => ({
        id: n.id,
        type: n.type,
        direction: n.direction,
        serialNumber: n.serialNumber,
        issuerName: n.issuerName,
        amount: n.amount,
        currency: n.currency,
        maturityDate: n.maturityDate,
        status: n.status
    }))

    const inPortfolioAmount = checkNotes
        .filter(n => n.status === "IN_PORTFOLIO" && n.currency === "TRY")
        .reduce((sum, n) => sum + n.amount, 0)
        
    const collectedAmount = checkNotes
        .filter(n => n.status === "COLLECTED" && n.currency === "TRY")
        .reduce((sum, n) => sum + n.amount, 0)
        
    const bouncedAmount = checkNotes
        .filter(n => n.status === "BOUNCED" && n.currency === "TRY")
        .reduce((sum, n) => sum + n.amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("finance.checkNotes.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("finance.checkNotes.description")}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/finance/check-notes/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("finance.checkNotes.addDocument")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("finance.checkNotes.inPortfolio")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(inPortfolioAmount, "TRY")}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("finance.checkNotes.collected")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(collectedAmount, "TRY")}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <XSquare className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("finance.checkNotes.bounced")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(bouncedAmount, "TRY")}
                    </p>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <CheckNotesTable data={checkNotes} />
            </div>
        </div>
    )
}
