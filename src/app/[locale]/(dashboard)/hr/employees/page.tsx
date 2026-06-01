import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Plus, Users, UserCheck, UserX, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmployeesTable } from "@/components/hr/employees-table"
import { type Employee } from "@/components/hr/employee-columns"
import { getEmployees, getEmployeeStats, type EmployeeWithDepartment } from "@/lib/actions/employees"

export default async function EmployeesPage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations("employees")
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1
    const limit = Number(resolvedSearchParams?.limit) || 10
    const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : undefined

    const [paginatedEmployees, stats] = await Promise.all([
        getEmployees({ page, pageSize: limit, search }),
        getEmployeeStats(),
    ])

    const employeesData = "data" in paginatedEmployees ? paginatedEmployees.data : paginatedEmployees
    const pageCount = "totalPages" in paginatedEmployees ? paginatedEmployees.totalPages : 1

    // Transform database employees to match the Employee type
    const employees: Employee[] = employeesData.map((emp) => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || "",
        position: emp.position,
        department: emp.department ? { id: emp.department.id, name: emp.department.name } : { id: "", name: t("unassigned") },
        status: emp.status,
        hireDate: emp.hireDate,
        salary: Number(emp.salary),
    }))

    const totalEmployees = stats.total
    const activeEmployees = stats.active
    const onLeaveEmployees = stats.onLeave
    const departments = stats.departments

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/hr/employees/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addEmployee")}
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("totalEmployees")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{totalEmployees}</p>
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
                                {t("active")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{activeEmployees}</p>
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
                                {t("onLeave")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{onLeaveEmployees}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                            <UserX className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("departments")}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{departments}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                            <Building className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <EmployeesTable 
                data={employees} 
                pageCount={pageCount}
                pagination={{ pageIndex: page - 1, pageSize: limit }}
            />
        </div>
    )
}
