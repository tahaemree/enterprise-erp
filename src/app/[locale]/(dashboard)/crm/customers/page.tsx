import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { getTranslations } from "next-intl/server"
import { Plus, Users, UserCheck, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomersTable } from "@/components/crm/customers-table"
import { type Customer } from "@/components/crm/customer-columns"
import { formatCurrency } from "@/lib/utils"
import { getCustomers, getCustomerMetrics } from "@/lib/actions/customers"

interface PageProps {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CustomersPage(props: PageProps) {
    const searchParams = await props.searchParams
    const page = Number(searchParams.page) || 1
    const limit = Number(searchParams.limit) || 10
    const search = typeof searchParams.search === "string" ? searchParams.search : undefined

    const t = await getTranslations("customers")
    const tCommon = await getTranslations("common")

    // Fetch data and metrics in parallel for max performance
    const [paginatedCustomers, metrics] = await Promise.all([
        getCustomers({ page, pageSize: limit, search }),
        getCustomerMetrics()
    ])

    // Handle return type of getCustomers which might be an array if pagination params are null
    // But since we are explicitly passing page and pageSize, it will be PaginatedResult
    const customersData = "data" in paginatedCustomers ? paginatedCustomers.data : paginatedCustomers
    const pageCount = "totalPages" in paginatedCustomers ? paginatedCustomers.totalPages : 1

    const customers: Customer[] = customersData.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email || "",
        phone: c.phone || "",
        company: c.company || "",
        status: c.status,
        source: c.source,
        totalSpent: Number(c.totalSpent),
        orderCount: c.orderCount,
        createdAt: c.createdAt,
    }))

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/crm/customers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addCustomer")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {tCommon("total")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{metrics.totalCustomers}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {tCommon("active")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{metrics.activeCustomers}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                            <UserCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {tCommon("leads")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{metrics.leads}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {tCommon("revenue")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <CustomersTable 
                data={customers} 
                pageCount={pageCount}
                pagination={{ pageIndex: page - 1, pageSize: limit }}
            />
        </div>
    )
}
