import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Building, Hash, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function BankAccountDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("bankAccounts")

    const account = await db.bankAccount.findUnique({
        where: { id: params.id },
        include: {
            transactions: {
                orderBy: { date: 'desc' },
                take: 10
            }
        }
    })

    if (!account) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {account.bankName} - {account.accountNumber}
                        {!account.isActive && (
                            <Badge variant="destructive">{t("inactive", { fallback: "Inactive" })}</Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <CreditCard className="w-4 h-4" />
                        {account.iban}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/finance/bank-accounts/new?edit=${account.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t("balance", { fallback: "Balance" })}</CardTitle>
                        <CardDescription>{t("currentBalance", { fallback: "Current available balance" })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary">
                            {formatCurrency(account.balance as unknown as number, account.currency)}
                        </div>
                        <div className="mt-6 space-y-4 pt-6 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    {t("branch", { fallback: "Branch" })}
                                </span>
                                <span className="font-medium">{account.branchName || "-"} {account.branchCode ? `(${account.branchCode})` : ""}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    {t("accountNumber", { fallback: "Account Number" })}
                                </span>
                                <span className="font-medium">{account.accountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    {t("accountType", { fallback: "Account Type" })}
                                </span>
                                <span className="font-medium">{t(`type.${account.accountType}`, { fallback: account.accountType })}</span>
                            </div>
                        </div>

                        {account.description && (
                            <div className="mt-6 pt-4 border-t space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">{t("description", { fallback: "Description" })}</span>
                                <p className="text-sm">{account.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t("recentTransactions", { fallback: "Recent Transactions" })}</CardTitle>
                                <CardDescription>{t("recentTransactionsDesc", { fallback: "Latest 10 movements in this account" })}</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/finance/transactions">{t("viewAll", { fallback: "View All" })}</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {account.transactions.length > 0 ? (
                            <div className="space-y-4">
                                {account.transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : tx.type === 'EXPENSE' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {tx.type === 'INCOME' ? <ArrowDownRight className="w-5 h-5" /> : tx.type === 'EXPENSE' ? <ArrowUpRight className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <Link href={`/finance/transactions/${tx.id}`} className="font-medium hover:underline text-primary">
                                                    {tx.category || t(`txType.${tx.type}`, { fallback: tx.type })}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(tx.date)} {tx.reference ? `• Ref: ${tx.reference}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'EXPENSE' ? 'text-red-500' : ''}`}>
                                                {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                                {formatCurrency(tx.amount as unknown as number, tx.currency)}
                                            </p>
                                            <Badge variant="outline" className="mt-1 text-[10px] uppercase font-normal tracking-wider">
                                                {t(`txStatus.${tx.status}`, { fallback: tx.status })}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 border rounded-lg bg-muted/10">
                                <Activity className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground">{t("noTransactions", { fallback: "No transactions found for this account." })}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
