"use client"

import { Fragment } from "react"
import { Link } from "@/i18n/navigation"
import { usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight, Home } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { routing } from "@/i18n/routing"

const routeKeyMap: Record<string, string> = {
    dashboard: "overview",
    inventory: "inventory",
    products: "products",
    categories: "categories",
    suppliers: "suppliers",
    crm: "crm",
    customers: "customers",
    pipeline: "pipeline",
    finance: "finance",
    orders: "orders",
    transactions: "transactions",
    invoices: "invoices",
    hr: "hr",
    employees: "employees",
    departments: "departments",
    leave: "leaveRequests",
    "leave-requests": "leaveRequests",
    settings: "settings",
    new: "new",
    edit: "edit",
    accounting: "accounting",
    "customer-accounts": "customerAccounts",
    "supplier-accounts": "supplierAccounts",
    "bank-accounts": "bankAccounts",
    "cost-centers": "costCenters",
    "e-invoice": "einvoice",
    "despatch-advice": "despatchAdvice",
    "check-note": "checkNote",
    "exchange-rates": "exchangeRates",
    "tax-types": "taxTypes",
    "tax-calculator": "taxCalculator",
    reports: "reports",
    "ba-bs": "baBs",
    "inflation-coefficients": "inflationCoefficients",
    activity: "activityLog",
    system: "system",
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const t = useTranslations("sidebar")

    // Strip locale prefix from pathname for segment parsing
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .filter((segment) => !routing.locales.includes(segment as typeof routing.locales[number]))

    if (segments.length === 0) {
        return null
    }

    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-foreground">
                            <Home className="h-4 w-4" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>

                {segments.map((segment, index) => {
                    const href =
                        "/" +
                        segments
                            .slice(0, index + 1)
                            .join("/")
                    const isLast = index === segments.length - 1
                    const key = routeKeyMap[segment] || segment
                    const label = t.has(key) ? t(key) : segment

                    // Check if segment is an ID (UUID-like or numeric)
                    const isId =
                        /^[a-z0-9]{20,}$/i.test(segment) || /^\d+$/.test(segment)

                    if (isId) {
                        return (
                            <Fragment key={segment}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>
                                            {t("details") || "Details"}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={href}>
                                                {t("details") || "Details"}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-4 w-4" />
                                    </BreadcrumbSeparator>
                                )}
                            </Fragment>
                        )
                    }

                    return (
                        <Fragment key={segment}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>
                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>
                                            {label.charAt(0).toUpperCase() + label.slice(1)}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && (
                                <BreadcrumbSeparator>
                                    <ChevronRight className="h-4 w-4" />
                                </BreadcrumbSeparator>
                            )}
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
