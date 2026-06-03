import { notFound } from "next/navigation"
import { getEmployee } from "@/lib/actions/employees"
import { getTranslations } from "next-intl/server"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Calendar, Edit, Mail, Phone, Users, Wallet, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function EmployeeDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const t = await getTranslations("employees")
    const employee = await getEmployee(params.id)

    if (!employee) {
        notFound()
    }

    const leaveRequests = employee.leaveRequests || []

    // Calculate leave stats
    const totalLeaveDays = leaveRequests
        .filter((l: { status: string }) => l.status === "APPROVED")
        .reduce((acc: number, l: { startDate: Date | string; endDate: Date | string }) => {
            const days = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24)) + 1
            return acc + days
        }, 0)

    const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase()

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                        <AvatarFallback className="text-xl font-bold bg-primary/5 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {employee.firstName} {employee.lastName}
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-medium text-foreground">{employee.employeeId}</span>
                            <span>• {employee.position || t("noPosition", { fallback: "No Position" })}</span>
                            <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
                                {employee.status}
                            </Badge>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/hr/employees/new?edit=${employee.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t("contactInfo", { fallback: "Contact & Info" })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {employee.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{employee.email}</span>
                            </div>
                        )}
                        {employee.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{employee.phone}</span>
                            </div>
                        )}
                        {employee.department && (
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{employee.department.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span>{employee.employmentType || "Full-Time"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{t("hireDate", { fallback: "Hire Date" })}: {formatDate(employee.hireDate)}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                                {t("overview", { fallback: "Overview" })}
                            </TabsTrigger>
                            <TabsTrigger value="leaves" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                                {t("leaveHistory", { fallback: "Leave History" })} ({leaveRequests.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1">
                                            <Wallet className="w-4 h-4" /> {t("salary", { fallback: "Salary" })}
                                        </CardDescription>
                                        <CardTitle className="text-2xl">
                                            {employee.salary ? formatCurrency(employee.salary as unknown as number) : "-"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground">
                                            {t("perMonth", { fallback: "Per Month" })}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> {t("leavesTaken", { fallback: "Leaves Taken" })}
                                        </CardDescription>
                                        <CardTitle className="text-2xl">
                                            {totalLeaveDays} {t("days", { fallback: "Days" })}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground">
                                            {t("approvedLeaves", { fallback: "Approved leave days" })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="leaves" className="pt-6">
                            <Card>
                                <CardContent className="p-0">
                                    {leaveRequests.length > 0 ? (
                                        <div className="divide-y">
                                            {leaveRequests.map((leave: { id: string; type: string; startDate: Date | string; endDate: Date | string; status: string }) => {
                                                const days = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1
                                                return (
                                                    <div key={leave.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-medium flex items-center gap-2">
                                                                {leave.type}
                                                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                    {days} {t("days", { fallback: "Days" })}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge 
                                                                variant={leave.status === "APPROVED" ? "default" : leave.status === "REJECTED" ? "destructive" : "secondary"}
                                                                className="flex items-center gap-1"
                                                            >
                                                                {leave.status === "PENDING" && <Clock className="w-3 h-3" />}
                                                                {leave.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                                                                {leave.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {t("noLeaveRequests", { fallback: "No leave requests found." })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
