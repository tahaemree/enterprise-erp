"use client"

import { useTranslations } from "next-intl"
import {
    Package,
    UserPlus,
    ShoppingCart,
    FileText,
    ArrowRight,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions() {
    const t = useTranslations("dashboard")

    const actions = [
        {
            label: t("addProduct"),
            href: "/inventory/products/new",
            icon: Package,
            color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
        },
        {
            label: t("addCustomer"),
            href: "/crm/customers",
            icon: UserPlus,
            color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
        },
        {
            label: t("newOrder"),
            href: "/finance/orders",
            icon: ShoppingCart,
            color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
        },
        {
            label: t("createInvoice"),
            href: "/finance/invoices/new",
            icon: FileText,
            color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
        },
    ] as const

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium">{t("quickActions")}</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href="/finance/orders" className="flex items-center gap-1">
                        {t("viewAll")}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                {actions.map((action) => {
                    const Icon = action.icon
                    return (
                        <Button
                            key={action.label}
                            variant="outline"
                            size="sm"
                            asChild
                            className={`h-auto flex-col gap-1.5 p-3 ${action.color} border-transparent`}
                        >
                            <Link href={action.href}>
                                <Icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{action.label}</span>
                            </Link>
                        </Button>
                    )
                })}
            </CardContent>
        </Card>
    )
}
