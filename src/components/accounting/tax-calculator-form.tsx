"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { calculateTaxAction } from "@/lib/actions/tr-accounting"
import { KDV_RATE_OPTIONS, TEVKIFAT_OPTIONS, STOPAJ_OPTIONS, getTaxTypeLabel, type TaxCalculationResult, type KdvRate, type TevkifatRatio, type StopajRate } from "@/lib/services/tax-engine-types"
import { useTranslations } from "next-intl"

export function TaxCalculatorForm() {
    const t = useTranslations("taxCalculator")
    const [netAmount, setNetAmount] = useState("1000")
    const [kdvRate, setKdvRate] = useState<KdvRate>(18)
    const [tevkifatRatio, setTevkifatRatio] = useState<string>("none")
    const [stopajRate, setStopajRate] = useState<string>("none")
    const [isGross, setIsGross] = useState(false)
    const [result, setResult] = useState<TaxCalculationResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleCalculate() {
        setIsLoading(true)
        setError(null)
        try {
            const input = {
                netAmount: Number(netAmount),
                kdvRate,
                isGross,
                ...(tevkifatRatio !== "none" ? { tevkifatRatio: tevkifatRatio as TevkifatRatio } : {}),
                ...(stopajRate !== "none" ? { stopajRate: Number(stopajRate) as StopajRate } : {}),
            }
            const calcResult = await calculateTaxAction(input)
            if (!calcResult.ok) {
                setError(calcResult.error || "Calculation failed")
                return
            }
            setResult(calcResult.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Calculation failed")
        } finally {
            setIsLoading(false)
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t("inputTitle")}</CardTitle>
                    <CardDescription>
                        {t("inputDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t("amount")}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={netAmount}
                                onChange={(e) => setNetAmount(e.target.value)}
                                placeholder="1000"
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGross(!isGross)}
                                className={isGross ? "bg-primary/10" : ""}
                            >
                                {isGross ? "KDV Dahil" : "KDV Hariç"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t("kdvRate")}</Label>
                        <Select
                            value={String(kdvRate)}
                            onValueChange={(v) => setKdvRate(Number(v) as KdvRate)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select KDV rate" />
                            </SelectTrigger>
                            <SelectContent>
                                {KDV_RATE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label} — {opt.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t("tevkifat")}</Label>
                        <Select
                            value={tevkifatRatio}
                            onValueChange={(v) => setTevkifatRatio(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select tevkifat ratio (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t("noTevkifat")}</SelectItem>
                                {TEVKIFAT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label} — {opt.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t("stopaj")}</Label>
                        <Select
                            value={stopajRate}
                            onValueChange={(v) => setStopajRate(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select stopaj rate (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t("noStopaj")}</SelectItem>
                                {STOPAJ_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label} — {opt.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
                        {isLoading ? "..." : t("calculate")}
                    </Button>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("resultTitle")}</CardTitle>
                    <CardDescription>
                        {t("resultDescription")} - {getTaxTypeLabel(kdvRate)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Net Tutar (KDV Matrahı)</span>
                                <span className="font-mono font-medium">{fmt(result.netAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">KDV ({result.kdvRate}%)</span>
                                <span className="font-mono font-medium">{fmt(result.kdvAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Brüt Tutar</span>
                                <span className="font-mono font-medium">{fmt(result.grossAmount)}</span>
                            </div>

                            {result.tevkifatAmount > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                        <span>Tevkifat ({result.tevkifatRatio})</span>
                                        <span className="font-mono">-{fmt(result.tevkifatAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ödenecek KDV</span>
                                        <span className="font-mono font-medium">{fmt(result.tevkifatNetKdv)}</span>
                                    </div>
                                </>
                            )}

                            {result.stopajAmount > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between text-red-600 dark:text-red-400">
                                        <span>Stopaj (%{result.stopajRate})</span>
                                        <span className="font-mono">{fmt(result.stopajAmount)}</span>
                                    </div>
                                </>
                            )}

                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Toplam Ödenecek</span>
                                <span className="font-mono">{fmt(result.totalPayable)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Toplam Vergi Yükü</span>
                                <span className="font-mono">{fmt(result.totalTaxBurden)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center text-muted-foreground text-center">
                            <p>{t("emptyResult")}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
