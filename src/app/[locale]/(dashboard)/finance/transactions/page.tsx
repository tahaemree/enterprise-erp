import { Link } from "@/i18n/navigation"
import { Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionsTable } from "@/components/finance/transactions-table"
import { type Transaction } from "@/components/finance/transaction-columns"
import { formatCurrency } from "@/lib/utils"
import { getTransactions, getTransactionStats } from "@/lib/actions/transactions"

export default async function TransactionsPage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations("finance.transactions")
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1
    const limit = Number(resolvedSearchParams?.limit) || 10
    const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : undefined
    const type = typeof resolvedSearchParams?.type === "string" ? resolvedSearchParams.type : undefined

    const [paginatedTransactions, stats] = await Promise.all([
        getTransactions({ page, pageSize: limit, search, type }),
        getTransactionStats(),
    ])

    const transactionsData = "data" in paginatedTransactions ? paginatedTransactions.data : paginatedTransactions
    const pageCount = "totalPages" in paginatedTransactions ? paginatedTransactions.totalPages : 1

    const transactions: Transaction[] = transactionsData.map((tx) => ({
        id: tx.id,
        type: tx.type as "INCOME" | "EXPENSE" | "REFUND" | "TRANSFER",
        category: tx.category,
        description: tx.description || "",
        amount: Number(tx.amount),
        reference: tx.reference || "",
        date: tx.date,
        createdAt: tx.createdAt,
    }))

    const totalIncome = stats.totalIncome
    const totalExpenses = stats.totalExpenses
    const netBalance = totalIncome - totalExpenses

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/finance/transactions/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addTransaction")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalIncome")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        +{formatCurrency(totalIncome)}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalExpenses")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(totalExpenses)}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("netBalance")}
                        </span>
                    </div>
                    <p
                        className={`mt-2 text-2xl font-bold ${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                        {netBalance >= 0 ? "+" : ""}
                        {formatCurrency(netBalance)}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("profitMargin")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {totalIncome > 0
                            ? ((netBalance / totalIncome) * 100).toFixed(1)
                            : 0}
                        %
                    </p>
                </div>
            </div>

            <Tabs defaultValue={type || "all"} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all" asChild>
                        <Link href="/finance/transactions">
                            {t("all")}
                        </Link>
                    </TabsTrigger>
                    <TabsTrigger value="income" asChild>
                        <Link href="/finance/transactions?type=income">
                            {t("income")}
                        </Link>
                    </TabsTrigger>
                    <TabsTrigger value="expenses" asChild>
                        <Link href="/finance/transactions?type=expenses">
                            {t("expenses")}
                        </Link>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={type || "all"} className="space-y-4">
                    <TransactionsTable
                        data={transactions}
                        pageCount={pageCount}
                        pagination={{ pageIndex: page - 1, pageSize: limit }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
