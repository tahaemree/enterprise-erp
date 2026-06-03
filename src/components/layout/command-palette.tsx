"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { 
    Search, LayoutDashboard, Package, Tags, Truck, 
    Users, TrendingUp, ShoppingCart, CreditCard, FileText, 
    UserCircle, Building2, CalendarRange, Settings,
    FileSpreadsheet, Landmark, Building, Calculator, DollarSign, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Command } from "cmdk"
import type { ComponentType } from "react"

interface CommandItem {
    id: string
    label: string
    href: string
    icon: ComponentType<{ className?: string }>
    keywords?: string[]
}

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const router = useRouter()
    const t = useTranslations("sidebar")

    const commands: CommandItem[] = [
        { id: "dashboard", label: t("overview"), href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "pano"] },
        { id: "products", label: t("products"), href: "/inventory/products", icon: Package, keywords: ["ürünler", "envanter"] },
        { id: "categories", label: t("categories"), href: "/inventory/categories", icon: Tags, keywords: ["kategoriler"] },
        { id: "suppliers", label: t("suppliers"), href: "/inventory/suppliers", icon: Truck, keywords: ["tedarikçiler"] },
        { id: "customers", label: t("customers"), href: "/crm/customers", icon: Users, keywords: ["müşteriler"] },
        { id: "pipeline", label: t("pipeline"), href: "/crm/pipeline", icon: TrendingUp, keywords: ["leads", "satış"] },
        { id: "orders", label: t("orders"), href: "/finance/orders", icon: ShoppingCart, keywords: ["siparişler"] },
        { id: "transactions", label: t("transactions"), href: "/finance/transactions", icon: CreditCard, keywords: ["işlemler"] },
        { id: "invoices", label: t("invoices"), href: "/finance/invoices", icon: FileText, keywords: ["faturalar"] },
        { id: "employees", label: t("employees"), href: "/hr/employees", icon: UserCircle, keywords: ["çalışanlar"] },
        { id: "departments", label: t("departments"), href: "/hr/departments", icon: Building2, keywords: ["departmanlar"] },
        { id: "leave", label: t("leaveRequests"), href: "/hr/leave", icon: CalendarRange, keywords: ["izinler"] },
        { id: "settings", label: t("settings"), href: "/settings", icon: Settings, keywords: ["ayarlar"] },
        { id: "einvoice", label: t("einvoice"), href: "/accounting/e-invoice", icon: FileSpreadsheet, keywords: ["efatura", "fatura"] },
        { id: "bank-accounts", label: t("bankAccounts"), href: "/accounting/bank-accounts", icon: Landmark, keywords: ["bankalar"] },
        { id: "cost-centers", label: t("costCenters"), href: "/accounting/cost-centers", icon: Building, keywords: ["masraf"] },
        { id: "tax-types", label: t("taxTypes"), href: "/accounting/tax-types", icon: Calculator, keywords: ["vergi"] },
        { id: "exchange-rates", label: t("exchangeRates"), href: "/accounting/exchange-rates", icon: DollarSign, keywords: ["döviz", "kur"] },
        { id: "reports", label: t("reports"), href: "/finance/reports", icon: FileText, keywords: ["raporlar"] },
        { id: "activity", label: t("activityLog"), href: "/settings/activity", icon: Activity, keywords: ["log", "aktivite"] },
    ]

    const handleSelect = useCallback(
        (href: string) => {
            setOpen(false)
            setSearch("")
            router.push(href)
        },
        [router]
    )

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-64 justify-start rounded-xl border bg-muted/30 text-sm text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-background hover:shadow-[0_0_15px_rgba(var(--primary),0.12)] hover:text-foreground pr-14"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{t("typeCommandOrSearch")}</span>
                <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-[500px]" showCloseButton={false}>
                    <DialogTitle className="sr-only">Command Palette</DialogTitle>
                    <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                        <div className="p-3 pb-2">
                            <div className="flex items-center rounded-lg border-2 border-primary/20 focus-within:border-primary/50 bg-transparent px-3 transition-colors">
                                <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder={t("typeCommandOrSearch")}
                                    className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 border-none ring-0 focus:border-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 shadow-none"
                                    style={{ outline: "none", boxShadow: "none" }}
                                />
                            </div>
                        </div>
                        <div className="border-b" />
                        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                            <Command.Empty className="py-6 text-center text-sm">
                                {t("noResults")}
                            </Command.Empty>
                            <Command.Group heading={search ? t("search") : t("suggested")}>
                                {commands
                                    .filter(
                                        (item) =>
                                            search === "" ||
                                            item.label.toLowerCase().includes(search.toLowerCase()) ||
                                            item.keywords?.some((k) =>
                                                k.toLowerCase().includes(search.toLowerCase())
                                            )
                                    )
                                    .map((item) => (
                                        <Command.Item
                                            key={item.id}
                                            value={item.id}
                                            onSelect={() => handleSelect(item.href)}
                                            className="flex cursor-pointer select-none items-center rounded-lg px-3 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground transition-colors my-1"
                                        >
                                            <item.icon className="mr-3 h-5 w-5 opacity-70" />
                                            <span>{item.label}</span>
                                        </Command.Item>
                                    ))}
                            </Command.Group>
                        </Command.List>
                        <div className="flex items-center justify-end gap-3 border-t p-3 text-xs text-muted-foreground bg-muted/20">
                            <span className="flex items-center gap-1.5">
                                <kbd className="flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans font-medium text-muted-foreground">↑↓</kbd> 
                                {t("navigate")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans font-medium text-muted-foreground">Enter</kbd> 
                                {t("select")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans font-medium text-muted-foreground">Esc</kbd> 
                                {t("exit")}
                            </span>
                        </div>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    )
}
