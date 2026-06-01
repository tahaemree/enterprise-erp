"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { revalueBalancesAction } from "@/lib/actions/tr-accounting"
import { formatCurrency, formatDate } from "@/lib/utils"

export function RevaluationForm() {
    const router = useRouter()
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [coefficient, setCoefficient] = useState(1.0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{
        adjustments: Array<{
            label: string
            accountCode: string
            bookValue: number
            adjustedValue: number
            difference: number
        }>
        summary: {
            totalBookValue: number
            totalAdjustedValue: number
            totalDifference: number
        }
        journalEntry: {
            description: string
            date: Date
            lines: Array<{
                side: "DEBIT" | "CREDIT"
                accountCode: string
                amount: number
                description: string
            }>
        }
    } | null>(null)

    async function handleRevalue() {
        setIsSubmitting(true)
        try {
            const res = await revalueBalancesAction(year, month, coefficient)
            if (!res.ok) {
                toast.error(res.error || "Failed to revalue balances")
                return
            }
            setResult(res.data)
            toast.success(`Revaluation complete! Difference: ${formatCurrency(res.data.summary.totalDifference, "TRY", "tr-TR")}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to revalue balances")
        } finally {
            setIsSubmitting(false)
        }
    }

    const fmt = (n: number) => formatCurrency(n, "TRY", "tr-TR")

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Enflasyon Düzeltmesi (Revaluation)</CardTitle>
                    <CardDescription>
                        Apply inflation correction to all customer and supplier accounts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="number"
                                min={2020}
                                max={2100}
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="month">Month</Label>
                            <Input
                                id="month"
                                type="number"
                                min={1}
                                max={12}
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="coeff">Correction Coefficient</Label>
                        <Input
                            id="coeff"
                            type="number"
                            step="0.00000001"
                            min="1"
                            value={coefficient}
                            onChange={(e) => setCoefficient(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Must match a coefficient in your Inflation Coefficients table
                        </p>
                    </div>

                    <Button
                        onClick={handleRevalue}
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                    >
                        {isSubmitting ? "Revaluing..." : "Apply Revaluation"}
                    </Button>

                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <p className="font-medium">⚠ Important</p>
                        <p className="mt-1">
                            This will calculate inflation adjustments for all active customer and
                            supplier accounts using the specified coefficient. A journal entry
                            will be generated for the adjustment.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Result</CardTitle>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Book Value</span>
                                    <span className="font-mono">{fmt(result.summary.totalBookValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Adjusted Value</span>
                                    <span className="font-mono">{fmt(result.summary.totalAdjustedValue)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Difference</span>
                                    <span className={result.summary.totalDifference >= 0 ? "text-green-600" : "text-red-600"}>
                                        {result.summary.totalDifference >= 0 ? "+" : ""}{fmt(result.summary.totalDifference)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                                    Adjustments ({result.adjustments.length})
                                </h4>
                                <div className="max-h-40 space-y-1 overflow-y-auto">
                                    {result.adjustments.map((adj, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="truncate">{adj.label}</span>
                                            <span className={`ml-2 font-mono ${adj.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {adj.difference >= 0 ? "+" : ""}{fmt(adj.difference)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                                    Journal Entry
                                </h4>
                                <div className="rounded-lg border p-3">
                                    <p className="text-sm font-medium">{result.journalEntry.description}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(result.journalEntry.date)}</p>
                                    <div className="mt-2 space-y-1">
                                        {result.journalEntry.lines.map((line, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span>
                                                    <Badge variant={line.side === "DEBIT" ? "default" : "secondary"} className="mr-2">
                                                        {line.side === "DEBIT" ? "Borç" : "Alacak"}
                                                    </Badge>
                                                    <span className="font-mono">{line.accountCode}</span>
                                                </span>
                                                <span className="font-mono">{fmt(line.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push("/accounting/inflation-coefficients")}
                            >
                                Back to Coefficients
                            </Button>
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center text-muted-foreground">
                            <p>Configure parameters and click Apply Revaluation</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
