"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, Package, ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface StockAlertItem {
    id: string
    name: string
    sku: string | null
    quantity: number
    minStock: number
}

interface StockAlertsProps {
    products?: StockAlertItem[]
}

const getStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return "out"
    if (quantity <= minStock * 0.25) return "critical"
    if (quantity <= minStock) return "low"
    return "normal"
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "out":
            return "destructive"
        case "critical":
            return "destructive"
        case "low":
            return "secondary"
        default:
            return "default"
    }
}

export function StockAlerts({ products = [] }: StockAlertsProps) {
    const t = useTranslations("dashboard")
    const tInv = useTranslations("inventory.products")
    const tStatus = useTranslations("status")

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "out":
                return tInv("outOfStock")
            case "critical":
                return tStatus("CRITICAL") || "Kritik"
            case "low":
                return tInv("lowStock")
            default:
                return tStatus("NORMAL") || "Normal"
        }
    }
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        {t("stockAlerts")}
                    </CardTitle>
                    <CardDescription>{t("stockAlertsDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/inventory/products" className="flex items-center gap-1">
                        {t("viewAll")}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                        {products.length > 0 ? (
                            products.map((product) => {
                                const status = getStatus(product.quantity, product.minStock)
                                const stockPercentage = Math.min(
                                    (product.quantity / product.minStock) * 100,
                                    100
                                )
                                return (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {product.sku || "N/A"}
                                                    </p>
                                                </div>
                                                <Badge variant={getStatusColor(status) as "default" | "secondary" | "destructive"}>
                                                    {getStatusLabel(status)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={stockPercentage}
                                                    className={cn(
                                                        "h-2",
                                                        status === "out" || status === "critical"
                                                            ? "[&>div]:bg-destructive"
                                                            : "[&>div]:bg-yellow-500"
                                                    )}
                                                />
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {product.quantity} / {product.minStock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-muted-foreground text-center px-4">
                                {t("noStockAlerts") || "Düşük stoklu ürün bulunmuyor"}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
