import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Building2, Users, UserCircle, DollarSign } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { DepartmentsTable, type DepartmentRow } from "@/components/hr/departments-table"
import { getDepartments } from "@/lib/actions/departments"

export default async function DepartmentsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const departmentsData = await getDepartments()
    const departments: DepartmentRow[] = departmentsData.map((d: { id: string; name: string; description: string | null; employeeCount: number; budget: number | null; manager: { firstName: string; lastName: string } | null }) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        employeeCount: d.employeeCount,
        budget: d.budget,
        manager: d.manager,
    }))

    const t = await getTranslations("hr.departments")

    const totalDepartments = departments.length
    const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0)
    const departmentsWithManager = departments.filter((d) => d.manager).length
    const totalBudget = departments.reduce((sum, d) => sum + (d.budget || 0), 0)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/hr/departments/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addDepartment")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalDepartments")}</p>
                            <p className="text-2xl font-bold">{totalDepartments}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalEmployees")}</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalEmployees}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <UserCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("managedDepartments")}</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{departmentsWithManager}</p>
                        </div>
                    </div>
                </div>
                <div className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("totalBudget")}</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                ${totalBudget.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <DepartmentsTable data={departments} searchPlaceholder={t("search") || "Search departments..."} />
            </div>
        </div>
    )
}
