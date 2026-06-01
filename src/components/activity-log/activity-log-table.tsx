"use client"

import { useTranslations } from "next-intl"
import { DataTable } from "@/components/tables/data-table"
import { createActivityLogColumns, type ActivityLogRow } from "@/components/activity-log/activity-log-columns"

interface ActivityLogTableProps {
    data: ActivityLogRow[]
}

export function ActivityLogTable({ data }: ActivityLogTableProps) {
    const t = useTranslations()
    const columns = createActivityLogColumns(t)

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="description"
            searchPlaceholder={t("activityLog.searchLogs")}
            viewText={t("common.view")}
            toggleColumnsText={t("common.toggleColumns")}
            noResultsText={t("activityLog.noLogs")}
            rowsPerPageText={t("common.rowsPerPage")}
            pageText={t("common.page")}
            ofText={t("common.of")}
            rowSelectedText={t("common.row")}
            showingText={t("common.showing")}
            selectedText={t("common.selected")}
        />
    )
}
