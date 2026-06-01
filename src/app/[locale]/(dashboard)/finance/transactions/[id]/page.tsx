import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Receipt, Calendar, CreditCard, Building, Banknote, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function TransactionDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("transactions")

    const transaction = await db.transaction.findUnique({
        where: { id: params.id },
        include: {
            bankAccount: true,
            costCenter: true,
            order: {
                include: {
                    customer: true
                }
            }
        }
    })

    if (!transaction) {
        notFound()
    }

    const typeColors = {
        INCOME: "bg-emerald-500/10 text-emerald-500",
        EXPENSE: "bg-red-500/10 text-red-500",
        TRANSFER: "bg-blue-500/10 text-blue-500",
    }

    const statusColors = {
        PENDING: "bg-yellow-500/10 text-yellow-500",
        COMPLETED: "bg-green-500/10 text-green-500",
        FAILED: "bg-destructive/10 text-destructive",
        CANCELLED: "bg-muted text-muted-foreground",
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            {t("title", { fallback: "Transaction Details" })}
                        </h1>
                        <Badge className={statusColors[transaction.status as keyof typeof statusColors]} variant="secondary">
                            {t(`status.${transaction.status}`, { fallback: transaction.status })}
                        </Badge>
                        <Badge className={typeColors[transaction.type as keyof typeof typeColors]} variant="outline">
                            {t(`type.${transaction.type}`, { fallback: transaction.type })}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(transaction.date)}
                        {transaction.reference && (
                            <span className="ml-2 flex items-center gap-1 before:content-['•'] before:mr-2 before:text-muted-foreground">
                                <Receipt className="w-4 h-4" />
                                {t("reference", { fallback: "Ref:" })} {transaction.reference}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/finance/transactions/new?edit=${transaction.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t("overview", { fallback: "Overview" })}</CardTitle>
                        <CardDescription>{t("overviewDesc", { fallback: "Financial and categorization details" })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-6 rounded-lg bg-muted/30 border">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("amount", { fallback: "Amount" })}</p>
                                <p className={`text-4xl font-bold mt-1 ${transaction.type === 'INCOME' ? 'text-emerald-500' : transaction.type === 'EXPENSE' ? 'text-red-500' : ''}`}>
                                    {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                                    {formatCurrency(transaction.amount as unknown as number, transaction.currency)}
                                </p>
                            </div>
                            {transaction.exchangeRate && (
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground">{t("exchangeRate", { fallback: "Exchange Rate" })}</p>
                                    <p className="text-lg font-medium mt-1">{Number(transaction.exchangeRate).toFixed(4)}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {transaction.category && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Banknote className="w-4 h-4" />
                                        {t("category", { fallback: "Category" })}
                                    </span>
                                    <p className="font-medium">{transaction.category}</p>
                                </div>
                            )}
                            {transaction.bankAccount && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        {t("bankAccount", { fallback: "Bank Account" })}
                                    </span>
                                    <Link href={`/finance/bank-accounts/${transaction.bankAccount.id}`} className="font-medium hover:underline text-primary">
                                        {transaction.bankAccount.bankName} - {transaction.bankAccount.accountNumber}
                                    </Link>
                                </div>
                            )}
                            {transaction.costCenter && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        {t("costCenter", { fallback: "Cost Center" })}
                                    </span>
                                    <p className="font-medium">{transaction.costCenter.name}</p>
                                </div>
                            )}
                        </div>

                        {transaction.description && (
                            <div className="space-y-1 pt-4 border-t">
                                <span className="text-sm font-medium text-muted-foreground">{t("description", { fallback: "Description" })}</span>
                                <p className="text-sm whitespace-pre-wrap">{transaction.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {transaction.order && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    {t("linkedOrder", { fallback: "Linked Order" })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{t("orderNumber", { fallback: "Order Number" })}</p>
                                    <Link href={`/finance/orders/${transaction.order.id}`} className="font-medium hover:underline text-primary block text-lg">
                                        {transaction.order.orderNumber}
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t("orderTotal", { fallback: "Order Total" })}</p>
                                        <p className="font-medium mt-1">{formatCurrency(transaction.order.total as unknown as number)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t("orderStatus", { fallback: "Status" })}</p>
                                        <p className="font-medium mt-1">{transaction.order.status}</p>
                                    </div>
                                </div>
                                {transaction.order.customer && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{t("customer", { fallback: "Customer" })}</p>
                                        <Link href={`/crm/customers/${transaction.order.customer.id}`} className="font-medium hover:underline text-primary block">
                                            {transaction.order.customer.firstName} {transaction.order.customer.lastName}
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
