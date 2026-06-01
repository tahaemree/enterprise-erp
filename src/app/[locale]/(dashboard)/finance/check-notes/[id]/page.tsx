import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, FileSignature, Calendar, Building, User, FileText, ArrowRightLeft } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function CheckNoteDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("checkNotes")

    const checkNote = await db.checkPromissoryNote.findUnique({
        where: { id: params.id },
        include: {
            customer: true,
            bankAccount: true
        }
    })

    if (!checkNote) {
        notFound()
    }

    const typeColors = {
        CHECK: "bg-blue-500/10 text-blue-500",
        PROMISSORY_NOTE: "bg-purple-500/10 text-purple-500",
    }

    const directionColors = {
        GIVEN: "bg-orange-500/10 text-orange-500",
        RECEIVED: "bg-emerald-500/10 text-emerald-500",
    }

    const statusColors = {
        IN_PORTFOLIO: "bg-slate-500/10 text-slate-500",
        ENDORSED: "bg-blue-500/10 text-blue-500",
        CASHED: "bg-emerald-500/10 text-emerald-500",
        BOUNCED: "bg-red-500/10 text-red-500",
        RETURNED: "bg-yellow-500/10 text-yellow-500",
    }

    // Parse endorsements if they exist
    let endorsements = []
    try {
        if (checkNote.endorsements && typeof checkNote.endorsements === 'string') {
            endorsements = JSON.parse(checkNote.endorsements)
        } else if (Array.isArray(checkNote.endorsements)) {
            endorsements = checkNote.endorsements
        }
    } catch (e) {
        // Fallback
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {checkNote.serialNumber}
                        </h1>
                        <Badge className={typeColors[checkNote.type as keyof typeof typeColors]} variant="secondary">
                            {t(`type.${checkNote.type}`, { fallback: checkNote.type })}
                        </Badge>
                        <Badge className={directionColors[checkNote.direction as keyof typeof directionColors]} variant="outline">
                            {t(`direction.${checkNote.direction}`, { fallback: checkNote.direction })}
                        </Badge>
                        <Badge className={statusColors[checkNote.status as keyof typeof statusColors]}>
                            {t(`status.${checkNote.status}`, { fallback: checkNote.status })}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {t("maturityDate", { fallback: "Maturity Date" })}: <strong className="text-foreground">{formatDate(checkNote.maturityDate)}</strong>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/finance/check-notes/new?edit=${checkNote.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSignature className="w-5 h-5" />
                            {t("details", { fallback: "Check/Note Details" })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-6 rounded-lg bg-muted/30 border">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("amount", { fallback: "Amount" })}</p>
                                <p className="text-4xl font-bold mt-1 text-primary">
                                    {formatCurrency(checkNote.amount as unknown as number, checkNote.currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-muted-foreground">{t("issueDate", { fallback: "Issue Date" })}</p>
                                <p className="text-lg font-medium mt-1">{formatDate(checkNote.issueDate)}</p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t("issuerName", { fallback: "Issuer / Payee" })}
                                </span>
                                <p className="font-medium">{checkNote.issuerName}</p>
                                {checkNote.issuerTaxId && <p className="text-xs text-muted-foreground mt-1">VKN/TCKN: {checkNote.issuerTaxId}</p>}
                            </div>

                            {checkNote.bankName && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        {t("bankDetails", { fallback: "Bank Details" })}
                                    </span>
                                    <p className="font-medium">{checkNote.bankName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {checkNote.bankBranch && <span>{checkNote.bankBranch} </span>}
                                        {checkNote.accountNumber && <span>(Hesap: {checkNote.accountNumber})</span>}
                                    </p>
                                </div>
                            )}

                            {checkNote.customer && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        {t("relatedCustomer", { fallback: "Related Customer" })}
                                    </span>
                                    <Link href={`/crm/customers/${checkNote.customer.id}`} className="font-medium hover:underline text-primary">
                                        {checkNote.customer.firstName} {checkNote.customer.lastName}
                                    </Link>
                                </div>
                            )}

                            {checkNote.bankAccount && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        {t("relatedBankAccount", { fallback: "Cashed in Bank Account" })}
                                    </span>
                                    <Link href={`/finance/bank-accounts/${checkNote.bankAccount.id}`} className="font-medium hover:underline text-primary">
                                        {checkNote.bankAccount.bankName} - {checkNote.bankAccount.accountNumber}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {checkNote.notes && (
                            <div className="space-y-1 pt-4 border-t">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4" />
                                    {t("notes", { fallback: "Notes" })}
                                </span>
                                <p className="text-sm whitespace-pre-wrap">{checkNote.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {(checkNote.status === 'BOUNCED' || checkNote.protestDate) && (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/50">
                            <CardHeader>
                                <CardTitle className="text-red-600 dark:text-red-500">{t("protestDetails", { fallback: "Protest Details" })}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {checkNote.protestDate && (
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-red-600/70">{t("protestDate", { fallback: "Protest Date" })}</span>
                                        <span className="font-medium text-red-700 dark:text-red-400">{formatDate(checkNote.protestDate)}</span>
                                    </div>
                                )}
                                {checkNote.protestFee && (
                                    <div className="flex justify-between pt-2 border-t border-red-200">
                                        <span className="text-sm font-medium text-red-600/70">{t("protestFee", { fallback: "Protest Fee" })}</span>
                                        <span className="font-medium text-red-700 dark:text-red-400">{formatCurrency(checkNote.protestFee as unknown as number, checkNote.currency)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5" />
                                {t("endorsements", { fallback: "Endorsements (Ciro)" })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {endorsements && endorsements.length > 0 ? (
                                <div className="space-y-4">
                                    {endorsements.map((endorser: any, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{endorser.name}</p>
                                                {endorser.date && <p className="text-xs text-muted-foreground">{formatDate(endorser.date)}</p>}
                                                {endorser.notes && <p className="text-sm mt-1 text-muted-foreground">{endorser.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">{t("noEndorsements", { fallback: "No endorsements recorded." })}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
