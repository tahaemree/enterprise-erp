import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ReceiptText, Calendar, ArrowRightLeft, AlignLeft } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AccountEntryDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("accountEntries")

    const entry = await db.accountEntry.findUnique({
        where: { id: params.id },
        include: {
            lines: {
                include: {
                    customerAccount: true,
                    supplierAccount: true,
                    bankAccount: true,
                    costCenter: true,
                }
            }
        }
    })

    if (!entry) {
        notFound()
    }

    const typeColors = {
        OPENING: "bg-blue-500/10 text-blue-500",
        CLOSING: "bg-slate-500/10 text-slate-500",
        NORMAL: "bg-primary/10 text-primary",
        ADJUSTMENT: "bg-yellow-500/10 text-yellow-500",
    }

    // Calculate totals
    const totalDebit = entry.lines
        .filter(l => l.side === 'DEBIT')
        .reduce((sum, l) => sum + Number(l.amount), 0)

    const totalCredit = entry.lines
        .filter(l => l.side === 'CREDIT')
        .reduce((sum, l) => sum + Number(l.amount), 0)

    const isBalanced = totalDebit === totalCredit

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {entry.entryNumber}
                        </h1>
                        <Badge className={typeColors[entry.entryType as keyof typeof typeColors]} variant="secondary">
                            {t(`type.${entry.entryType}`, { fallback: entry.entryType })}
                        </Badge>
                        {!isBalanced && (
                            <Badge variant="destructive">{t("unbalanced", { fallback: "Unbalanced" })}</Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(entry.entryDate)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/accounting/entries/new?edit=${entry.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="w-5 h-5" />
                        {t("details", { fallback: "Entry Details" })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-2">
                        <AlignLeft className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("description", { fallback: "Description" })}</p>
                            <p className="mt-1 font-medium">{entry.description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5" />
                            {t("lines", { fallback: "Entry Lines" })}
                        </div>
                    </CardTitle>
                    <CardDescription>{t("linesDesc", { fallback: "Debit and Credit lines for this entry" })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="p-3 text-left font-medium">{t("lineDesc", { fallback: "Description" })}</th>
                                    <th className="p-3 text-left font-medium">{t("relatedAccount", { fallback: "Related Account" })}</th>
                                    <th className="p-3 text-right font-medium">{t("debit", { fallback: "Debit" })}</th>
                                    <th className="p-3 text-right font-medium">{t("credit", { fallback: "Credit" })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {entry.lines.map((line) => (
                                    <tr key={line.id} className="hover:bg-muted/30">
                                        <td className="p-3 font-medium">
                                            {line.description || "-"}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-1">
                                                {line.bankAccount && (
                                                    <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md w-fit">
                                                        {line.bankAccount.bankName} - {line.bankAccount.accountNumber}
                                                    </span>
                                                )}
                                                {line.customerAccount && (
                                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md w-fit">
                                                        C: {line.customerAccount.accountCode}
                                                    </span>
                                                )}
                                                {line.supplierAccount && (
                                                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-md w-fit">
                                                        S: {line.supplierAccount.accountCode}
                                                    </span>
                                                )}
                                                {line.costCenter && (
                                                    <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded-md w-fit">
                                                        CC: {line.costCenter.name}
                                                    </span>
                                                )}
                                                {!line.bankAccount && !line.customerAccount && !line.supplierAccount && !line.costCenter && (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            {line.side === 'DEBIT' ? (
                                                <span className="font-medium text-emerald-500">{formatCurrency(line.amount as unknown as number, "TRY")}</span>
                                            ) : "-"}
                                        </td>
                                        <td className="p-3 text-right">
                                            {line.side === 'CREDIT' ? (
                                                <span className="font-medium text-blue-500">{formatCurrency(line.amount as unknown as number, "TRY")}</span>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/50 border-t font-bold">
                                <tr>
                                    <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-xs text-muted-foreground">{t("total", { fallback: "Total" })}</td>
                                    <td className="p-3 text-right text-emerald-500">{formatCurrency(totalDebit, "TRY")}</td>
                                    <td className="p-3 text-right text-blue-500">{formatCurrency(totalCredit, "TRY")}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
