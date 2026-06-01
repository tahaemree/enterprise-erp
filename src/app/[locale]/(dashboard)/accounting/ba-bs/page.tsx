import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Plus, FileSpreadsheet, FileText, FileCheck, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaBsTable } from "@/components/accounting/ba-bs-table"
import { type BaBsForm } from "@/components/accounting/ba-bs-columns"
import { getBaBsForms } from "@/lib/actions/tr-accounting"

export default async function BaBsFormsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations()
    const formData = await getBaBsForms()
    const forms: BaBsForm[] = formData.map((f) => ({
        id: f.id,
        formType: f.formType as "BA" | "BS",
        year: f.year,
        month: f.month,
        status: f.status as BaBsForm["status"],
        xmlContent: f.xmlContent,
        submittedAt: f.submittedAt,
        createdAt: f.createdAt,
        items: f.items.map((i) => ({
            id: i.id,
            taxId: i.taxId,
            name: i.name,
            documentCount: i.documentCount,
            totalAmount: Number(i.totalAmount),
        })),
    }))

    const totalBa = forms.filter((f) => f.formType === "BA").length
    const totalBs = forms.filter((f) => f.formType === "BS").length
    const pendingForms = forms.filter((f) => f.status === "DRAFT" || f.status === "PENDING").length

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("accounting.baBs.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("accounting.baBs.description")}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/accounting/ba-bs/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("accounting.baBs.generateNewForm")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.baBs.totalForms")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{forms.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.baBs.baPurchases")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{totalBa}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.baBs.bsSales")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{totalBs}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-muted-foreground">{t("accounting.baBs.pendingSubmission")}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingForms}</p>
                </div>
            </div>

            <BaBsTable data={forms} />
        </div>
    )
}
