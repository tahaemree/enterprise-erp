import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { StockAlerts } from "@/components/dashboard/stock-alerts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { DashboardKpiCards } from "@/components/reports/dashboard-kpi-cards"
import { Skeleton } from "@/components/ui/skeleton"
import {
    getRevenueData,
    getExpensesByCategory,
    getLowStockProducts,
    getRecentActivity,
    getRecentOrders,
} from "@/lib/actions/dashboard"
import { getDashboardKpisData } from "@/lib/actions/reports"

async function RevenueChartWrapper() {
    const data = await getRevenueData()
    return <RevenueChart data={data} />
}

async function ExpenseChartWrapper() {
    const data = await getExpensesByCategory()
    return <ExpenseChart data={data} />
}

async function ActivityFeedWrapper() {
    const data = await getRecentActivity()
    return <ActivityFeed activities={data} />
}

async function StockAlertsWrapper() {
    const data = await getLowStockProducts()
    return <StockAlerts products={data} />
}

async function RecentOrdersWrapper() {
    const data = await getRecentOrders()
    return <RecentOrders orders={data} />
}

async function KpiCardsWrapper() {
    const data = await getDashboardKpisData()
    return <DashboardKpiCards data={data} />
}

/**
 * Dashboard Page
 *
 * Bundle optimization note: Next.js App Router automatically handles
 * route-level code splitting. Heavy chart components (RevenueChart,
 * ExpenseChart) are streamed via Suspense boundaries, so they don't
 * block the initial page load. For deeper bundle splitting, these
 * components can be converted to client components and loaded via
 * `next/dynamic` if they grow significantly larger.
 */
export default async function DashboardPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("dashboard")

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-muted-foreground">
                    {t("welcomeBack")}
                </p>
            </div>

            {/* KPI Cards — single unified row */}
            <Suspense fallback={<KpiSkeleton />}>
                <KpiCardsWrapper />
            </Suspense>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Wide Components (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Suspense fallback={<ChartSkeleton />}>
                        <RevenueChartWrapper />
                    </Suspense>
                    
                    <Suspense fallback={<ListSkeleton />}>
                        <RecentOrdersWrapper />
                    </Suspense>
                    
                    <Suspense fallback={<ListSkeleton />}>
                        <ActivityFeedWrapper />
                    </Suspense>
                </div>

                {/* Right Column: Compact Widgets (1/3 width) */}
                <div className="flex flex-col gap-6">
                    <Suspense fallback={<CardSkeleton />}>
                        <QuickActions />
                    </Suspense>
                    
                    <Suspense fallback={<ChartSkeleton />}>
                        <ExpenseChartWrapper />
                    </Suspense>
                    
                    <Suspense fallback={<CardSkeleton />}>
                        <StockAlertsWrapper />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

function KpiSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
        </div>
    )
}

function ChartSkeleton() {
    return <Skeleton className="h-[400px] rounded-xl" />
}

function CardSkeleton() {
    return <Skeleton className="h-[400px] rounded-xl" />
}

function ListSkeleton() {
    return <Skeleton className="h-[400px] rounded-xl" />
}
