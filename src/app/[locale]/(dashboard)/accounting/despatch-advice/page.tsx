import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Plus, Truck, ClipboardList, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DespatchAdvicesTable } from "@/components/accounting/despatch-advices-table"
import { type DespatchAdvice } from "@/components/accounting/despatch-advice-columns"
import { getDespatchAdvices } from "@/lib/actions/tr-accounting"
import { formatCurrency } from "@/lib/utils"

export default async function DespatchAdviceListPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.despatchAdvice")
    const adviceData = await getDespatchAdvices()

    const advices: DespatchAdvice[] = adviceData.map((adv) => ({
        id: adv.id,
        uuid: adv.uuid,
        invoiceNumber: adv.invoiceNumber,
        status: adv.status,
        senderName: adv.senderName,
        senderTaxId: adv.senderTaxId,
        receiverName: adv.receiverName,
        receiverTaxId: adv.receiverTaxId,
        grossTotal: adv.grossTotal,
        netTotal: adv.netTotal,
        currency: adv.currency,
        issueDate: adv.issueDate,
        createdAt: adv.createdAt,
    }))

    const totalAdvices = advices.length
    const totalAmount = advices.reduce((sum, a) => sum + a.netTotal, 0)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/accounting/e-invoice">
                            <Truck className="mr-2 h-4 w-4" />
                            {t("goToEinvoice")}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/accounting/e-invoice/new?type=despatch">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("newDespatch")}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalDespatch")}</p>
                            <p className="text-2xl font-bold">{totalAdvices}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalAmount")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <DespatchAdvicesTable data={advices} />
            </div>
        </div>
    )
}
