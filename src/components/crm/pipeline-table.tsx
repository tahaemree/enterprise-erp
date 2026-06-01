"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Lead {
    id: string
    firstName: string
    lastName: string
    company: string | null
    status: string
    email: string
    totalSpent: number
    createdAt: Date
}

interface PipelineTableProps {
    data: Lead[]
    title: string
    description: string
    addLeadText: string
    totalLeadsText: string
    qualifiedText: string
    opportunitiesText: string
    negotiationsText: string
    searchText: string
    totalLeads: number
    qualifiedLeads: number
    opportunities: number
    negotiationLeads: number
}

export function PipelineTable({
    data,
    title,
    description,
    addLeadText,
    totalLeadsText,
    qualifiedText,
    opportunitiesText,
    negotiationsText,
    searchText,
    totalLeads: totalLeadsCount,
    qualifiedLeads: qualifiedLeadsCount,
    opportunities: opportunitiesCount,
    negotiationLeads: negotiationLeadsCount,
}: PipelineTableProps) {
    const t = useTranslations()

    const pipelineColumns = [
        {
            accessorKey: "firstName",
            header: t("pipeline.name") || "Name",
            cell: ({ row }: any) => (
                <div className="font-medium">
                    {row.original.firstName} {row.original.lastName}
                </div>
            ),
        },
        {
            accessorKey: "company",
            header: t("pipeline.company") || "Company",
            cell: ({ row }: any) => (
                <div className="text-muted-foreground">{row.getValue("company") || "—"}</div>
            ),
        },
        {
            accessorKey: "status",
            header: t("pipeline.status") || "Status",
            cell: ({ row }: any) => {
                const status = row.getValue("status") as string
                const statusColors: Record<string, string> = {
                    LEAD: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
                    QUALIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                    OPPORTUNITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
                    PROPOSAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                    NEGOTIATION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                }
                return (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || ""}`}>
                        {status}
                    </span>
                )
            },
        },
        {
            accessorKey: "email",
            header: t("pipeline.email") || "Email",
            cell: ({ row }: any) => (
                <div className="text-muted-foreground">{row.getValue("email") || "—"}</div>
            ),
        },
        {
            accessorKey: "totalSpent",
            header: t("pipeline.potentialValue") || "Value",
            cell: ({ row }: any) => {
                const value = row.getValue("totalSpent") as number
                return <div className="font-medium">{formatCurrency(value)}</div>
            },
        },
        {
            accessorKey: "createdAt",
            header: t("pipeline.created") || "Created",
            cell: ({ row }: any) => {
                const date = row.getValue("createdAt") as Date
                return <div className="text-muted-foreground">{new Date(date).toLocaleDateString()}</div>
            },
        },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/crm/pipeline/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {addLeadText}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {totalLeadsText}
                            </span>
                            <p className="text-3xl font-bold tracking-tight">{totalLeadsCount}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                            <span className="text-xl font-bold">L</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {qualifiedText}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {qualifiedLeadsCount}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                            <span className="text-xl font-bold">Q</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {opportunitiesText}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                {opportunitiesCount}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                            <span className="text-xl font-bold">O</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-muted-foreground">
                                {negotiationsText}
                            </span>
                            <p className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                                {negotiationLeadsCount}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                            <span className="text-xl font-bold">N</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={/* Wrapper removed to prevent edge collision */ ""}>
                <DataTable
                    columns={pipelineColumns}
                    data={data}
                    searchKey="firstName"
                    searchPlaceholder={searchText}
                />
            </div>
        </div>
    )
}
