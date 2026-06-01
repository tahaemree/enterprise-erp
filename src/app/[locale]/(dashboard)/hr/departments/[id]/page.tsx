import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Users, Network, Code, Briefcase, UserCircle, AlignLeft } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default async function DepartmentDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("departments")

    const department = await db.department.findUnique({
        where: { id: params.id },
        include: {
            parent: true,
            children: true,
            employees: {
                orderBy: {
                    firstName: 'asc'
                }
            }
        }
    })

    if (!department) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {department.color && (
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: department.color }}></div>
                        )}
                        {department.name}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Briefcase className="w-4 h-4" />
                        {department.employees.length} {t("employeesCount", { fallback: "Employees" })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/hr/departments/new?edit=${department.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("overview", { fallback: "Overview" })}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {department.code && (
                                <div className="space-y-1 border-b pb-4">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Code className="w-4 h-4" />
                                        {t("departmentCode", { fallback: "Department Code" })}
                                    </span>
                                    <p className="font-mono text-lg">{department.code}</p>
                                </div>
                            )}

                            {department.budget && (
                                <div className="space-y-1 border-b pb-4">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        {t("budget", { fallback: "Budget" })}
                                    </span>
                                    <p className="font-semibold text-lg text-primary">{formatCurrency(department.budget as unknown as number)}</p>
                                </div>
                            )}

                            {department.parent && (
                                <div className="space-y-1 border-b pb-4">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Network className="w-4 h-4" />
                                        {t("parentDepartment", { fallback: "Parent Department" })}
                                    </span>
                                    <Link href={`/hr/departments/${department.parent.id}`} className="font-medium hover:underline text-primary">
                                        {department.parent.name}
                                    </Link>
                                </div>
                            )}

                            {department.children.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <Network className="w-4 h-4" />
                                        {t("subDepartments", { fallback: "Sub Departments" })}
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        {department.children.map(child => (
                                            <Link key={child.id} href={`/hr/departments/${child.id}`} className="text-sm font-medium hover:underline text-primary">
                                                • {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {department.description && (
                                <div className="space-y-1 pt-4 border-t">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <AlignLeft className="w-4 h-4" />
                                        {t("description", { fallback: "Description" })}
                                    </span>
                                    <p className="text-sm whitespace-pre-wrap">{department.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {t("employees", { fallback: "Employees" })}
                            </CardTitle>
                            <CardDescription>{t("employeesDesc", { fallback: "People working in this department" })}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {department.employees.length > 0 ? (
                                <div className="space-y-4">
                                    {department.employees.map((employee) => (
                                        <Link 
                                            key={employee.id} 
                                            href={`/hr/employees/${employee.id}`}
                                            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{employee.firstName} {employee.lastName}</h4>
                                                <p className="text-sm text-muted-foreground">{employee.position || t("noPosition", { fallback: "No Position" })}</p>
                                            </div>
                                            <div className="text-right">
                                                {employee.status === 'ACTIVE' ? (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t("active", { fallback: "Active" })}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">{t("inactive", { fallback: "Inactive" })}</Badge>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 border rounded-lg bg-muted/10">
                                    <UserCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-muted-foreground">{t("noEmployees", { fallback: "No employees found in this department." })}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
