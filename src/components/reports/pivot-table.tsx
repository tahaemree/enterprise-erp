"use client"

import { useTranslations } from "next-intl"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Package, TrendingUp, Users, Receipt, Filter } from "lucide-react"

import type { PivotResult } from "@/lib/services/reporting-engine"

interface Props {
    data: PivotResult
    title?: string
    description?: string
}

export function PivotTable({ data, title, description }: Props) {
    const t = useTranslations("reports")

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title || t("pivotAnalysis")}</CardTitle>
                        <CardDescription>{description || t("pivotDescription")}</CardDescription>
                    </div>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">
                                    {data.config.rows.map((r) => r.label).join(" / ") || t("rowLabel")}
                                </TableHead>
                                {data.columnHeaders.map((col) => (
                                    <TableHead key={col} className="text-right min-w-[120px]">
                                        {col}
                                    </TableHead>
                                ))}
                                <TableHead className="text-right min-w-[120px] font-bold border-l-2">
                                    {t("total")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rowHeaders.map((row) => {
                                const rowTotal = data.data[row]?.["Total"]
                                return (
                                    <TableRow key={row} className="hover:bg-muted/50">
                                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                            {row}
                                        </TableCell>
                                        {data.columnHeaders.map((col) => {
                                            const cell = data.data[row]?.[col]
                                            return (
                                                <TableCell
                                                    key={`${row}-${col}`}
                                                    className={cn(
                                                        "text-right font-mono tabular-nums",
                                                        cell?.value !== 0 && "font-medium",
                                                    )}
                                                >
                                                    {cell?.formatted ?? "—"}
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="text-right font-bold font-mono border-l-2">
                                            {rowTotal?.formatted ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                        {/* Totals row */}
                        <TableRow className="bg-muted/30 font-bold">
                            <TableCell className="sticky left-0 bg-background z-10">
                                {t("total")}
                            </TableCell>
                            {data.columnHeaders.map((col) => (
                                <TableCell
                                    key={`total-${col}`}
                                    className="text-right font-bold font-mono"
                                >
                                    {data.totals[col]?.formatted ?? "—"}
                                </TableCell>
                            ))}
                            <TableCell className="text-right font-bold font-mono border-l-2">
                                {data.grandTotal.formatted}
                            </TableCell>
                        </TableRow>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

/**
 * Pre-built pivot configurations for common reports
 */
export const getPivotPresets = (t: any) => ({
    revenueByCategory: {
        name: t.has("pivot.revenueByCategory") ? t("pivot.revenueByCategory") : "Revenue by Category",
        icon: TrendingUp,
        config: {
            rows: [{ field: "category", label: t.has("pivot.category") ? t("pivot.category") : "Category" }],
            columns: [{ field: "type", label: t.has("pivot.type") ? t("pivot.type") : "Type" }],
            values: [{ field: "amount", label: t.has("pivot.amount") ? t("pivot.amount") : "Amount", aggregation: "sum" as const }],
            filters: { type: "INCOME" },
        },
    },
    expensesByCategory: {
        name: t.has("pivot.expensesByCategory") ? t("pivot.expensesByCategory") : "Expenses by Category",
        icon: Receipt,
        config: {
            rows: [{ field: "category", label: t.has("pivot.category") ? t("pivot.category") : "Category" }],
            columns: [{ field: "type", label: t.has("pivot.type") ? t("pivot.type") : "Type" }],
            values: [{ field: "amount", label: t.has("pivot.amount") ? t("pivot.amount") : "Amount", aggregation: "sum" as const }],
            filters: { type: "EXPENSE" },
        },
    },
    monthlyRevenue: {
        name: t.has("pivot.monthlyRevenue") ? t("pivot.monthlyRevenue") : "Monthly Revenue",
        icon: TrendingUp,
        config: {
            rows: [{ field: "date", label: t.has("pivot.date") ? t("pivot.date") : "Month" }],
            columns: [{ field: "type", label: t.has("pivot.type") ? t("pivot.type") : "Type" }],
            values: [{ field: "amount", label: t.has("pivot.amount") ? t("pivot.amount") : "Amount", aggregation: "sum" as const }],
        },
    },
    customerRevenue: {
        name: t.has("pivot.customerRevenue") ? t("pivot.customerRevenue") : "Revenue by Customer",
        icon: Users,
        config: {
            rows: [{ field: "customer_company", label: t.has("pivot.company") ? t("pivot.company") : "Company" }],
            columns: [{ field: "customer_status", label: t.has("pivot.customerStatus") ? t("pivot.customerStatus") : "Customer Status" }],
            values: [{ field: "order_total", label: t.has("pivot.orderTotal") ? t("pivot.orderTotal") : "Order Total", aggregation: "sum" as const }],
        },
    },
    productPerformance: {
        name: t.has("pivot.productPerformance") ? t("pivot.productPerformance") : "Product Performance",
        icon: Package,
        config: {
            rows: [{ field: "category", label: t.has("pivot.productCategory") ? t("pivot.productCategory") : "Product Category" }],
            columns: [{ field: "type", label: t.has("pivot.transactionType") ? t("pivot.transactionType") : "Transaction Type" }],
            values: [{ field: "amount", label: t.has("pivot.amount") ? t("pivot.amount") : "Amount", aggregation: "sum" as const }],
        },
    },
})

export type PivotPresetKey = "revenueByCategory" | "expensesByCategory" | "monthlyRevenue" | "customerRevenue" | "productPerformance"
