import { getTranslations } from "next-intl/server"
import { getActivityLogs } from "@/lib/actions/activity-log"
import { ActivityLogTable } from "@/components/activity-log/activity-log-table"
import { ScrollText } from "lucide-react"

export default async function ActivityLogPage({
    searchParams: _searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations()

    const result = await getActivityLogs({
        pageSize: 50,
    })

    const logs = result.ok
        ? result.data.logs.map((log) => ({
              id: log.id,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              description: log.description,
              metadata: log.metadata as Record<string, unknown> | null,
              createdAt: log.createdAt,
              user: log.user ?? null,
          }))
        : []

    const totalLogs = result.ok ? result.data.total : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t("activityLog.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("activityLog.description")}
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                    <ScrollText className="h-4 w-4" />
                    <span>
                        {t("activityLog.totalLogs", {
                            count: totalLogs,
                        })}
                    </span>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <ActivityLogTable data={logs} />
            </div>
        </div>
    )
}
