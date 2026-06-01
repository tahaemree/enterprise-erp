import { Link } from "@/i18n/navigation"
import { Plus, ScrollText, CheckSquare, XSquare, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import { CheckNotesTable } from "@/components/accounting/check-notes-table"
import {
    type CheckNoteRow,
} from "@/components/finance/check-note-columns"
import { getCheckNotes } from "@/lib/actions/check-notes"
import { formatCurrency } from "@/lib/utils"

export default async function AccountingCheckNotesPage({
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

    const totalCount = checkNotes.length
    const portfolioCount = checkNotes.filter(n => n.status === "IN_PORTFOLIO").length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("accounting.checkNote.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("accounting.checkNote.description")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{t("accounting.checkNote.documents", { count: totalCount })}</span>
                    </div>
                    <Button asChild>
                        <Link href="/accounting/check-note/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("accounting.checkNote.addDocument")}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.checkNote.inPortfolio")}</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(inPortfolioAmount, "TRY")}
                            </p>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("accounting.checkNote.items", { count: portfolioCount })}</p>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.checkNote.collected")}</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(collectedAmount, "TRY")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                            <XSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.checkNote.bounced")}</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(bouncedAmount, "TRY")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("accounting.checkNote.totalDocuments")}</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {totalCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <CheckNotesTable data={checkNotes} />
            </div>
        </div>
    )
}
