import { getDashboardStats, getRevenueData, getExpensesByCategory } from "@/lib/actions/dashboard"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
    const [stats, revenueData, expenseCategories] = await Promise.all([
        getDashboardStats(),
        getRevenueData(),
        getExpensesByCategory(),
    ])

    return (
        <DashboardClient
            stats={stats}
            revenueData={revenueData}
            expenseCategories={expenseCategories}
        />
    )
}
