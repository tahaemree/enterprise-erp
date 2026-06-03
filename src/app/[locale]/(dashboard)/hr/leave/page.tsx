import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Calendar, Clock, Check, X } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type LeaveRequest } from "@/components/hr/leave-request-columns"
import { LeaveRequestsTable } from "@/components/hr/leave-requests-table"
import { getLeaveRequests } from "@/lib/actions/leave-requests"

export default async function LeaveRequestsPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("hr.leave")

    const leaveRequestsData = await getLeaveRequests()

    const leaveRequests: LeaveRequest[] = leaveRequestsData.map((r) => ({
        id: r.id,
        employee: {
            id: r.employee.id,
            firstName: r.employee.firstName,
            lastName: r.employee.lastName,
            position: r.employee.position,
            department: r.employee.department?.name || "Unassigned",
        },
        type: r.type,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason || "",
        createdAt: r.createdAt,
    }))

    const pendingRequests = leaveRequests.filter(
        (r) => r.status === "PENDING"
    )
    const approvedRequests = leaveRequests.filter(
        (r) => r.status === "APPROVED"
    )
    const rejectedRequests = leaveRequests.filter(
        (r) => r.status === "REJECTED"
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/hr/leave/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("submitRequest")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalRequests")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {leaveRequests.length}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("pending")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {pendingRequests.length}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("approved")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {approvedRequests.length}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("rejected")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {rejectedRequests.length}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">
                        {t("pending")} ({pendingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        {t("approved")} ({approvedRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        {t("rejected")} ({rejectedRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        {t("all")} ({leaveRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <LeaveRequestsTable data={pendingRequests} searchPlaceholder={t("searchRequests")} />
                </TabsContent>
                <TabsContent value="approved" className="space-y-4">
                    <LeaveRequestsTable data={approvedRequests} searchPlaceholder={t("searchRequests")} />
                </TabsContent>
                <TabsContent value="rejected" className="space-y-4">
                    <LeaveRequestsTable data={rejectedRequests} searchPlaceholder={t("searchRequests")} />
                </TabsContent>
                <TabsContent value="all" className="space-y-4">
                    <LeaveRequestsTable data={leaveRequests} searchPlaceholder={t("searchRequests")} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
