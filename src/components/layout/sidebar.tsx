"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import {
    LayoutDashboard,
    Package,
    Users,
    Settings,
    Building2,
    Tags,
    Truck,
    ShoppingCart,
    Receipt,
    FileText,
    UserCheck,
    CalendarDays,
    Briefcase,
    TrendingUp,
    Landmark,
    Wallet,
    ArrowLeftRight,
    FileDigit,
    Percent,
    Calculator,
    NotebookText,
    ClipboardList,
    BarChart3,
    ScrollText,
    Menu,
    UserCircle,
    Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

// ─── Types ────────────────────────────────────────────────────────────

interface NavItem {
    titleKey: string
    href: string
    icon: React.ElementType
    badge?: string
}

interface NavSubGroup {
    titleKey: string
    items: NavItem[]
}

interface NavGroup {
    id: string
    titleKey: string
    icon: React.ElementType
    href?: string
    items?: NavItem[]
    subGroups?: NavSubGroup[]
    bottom?: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
    {
        id: "overview",
        titleKey: "overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        id: "crm",
        titleKey: "crm",
        icon: Users,
        items: [
            { titleKey: "customers", href: "/crm/customers", icon: Users },
            { titleKey: "pipeline", href: "/crm/pipeline", icon: TrendingUp },
        ],
    },
    {
        id: "inventory",
        titleKey: "inventory",
        icon: Package,
        items: [
            { titleKey: "products", href: "/inventory/products", icon: Package },
            { titleKey: "categories", href: "/inventory/categories", icon: Tags },
            { titleKey: "suppliers", href: "/inventory/suppliers", icon: Truck },
        ],
    },
    {
        id: "accounting",
        titleKey: "accounting",
        icon: Calculator,
        subGroups: [
            {
                titleKey: "accountingAccounts",
                items: [
                    { titleKey: "customerAccounts", href: "/accounting/customer-accounts", icon: Users },
                    { titleKey: "supplierAccounts", href: "/accounting/supplier-accounts", icon: Truck },
                    { titleKey: "accountEntries", href: "/accounting/entries", icon: NotebookText },
                    { titleKey: "bankAccounts", href: "/accounting/bank-accounts", icon: Landmark },
                    { titleKey: "costCenters", href: "/accounting/cost-centers", icon: Calculator },
                ],
            },
            {
                titleKey: "accountingDocuments",
                items: [
                    { titleKey: "einvoice", href: "/accounting/e-invoice", icon: FileText },
                    { titleKey: "despatchAdvice", href: "/accounting/despatch-advice", icon: ScrollText },
                    { titleKey: "checkNote", href: "/accounting/check-note", icon: ClipboardList },
                ],
            },
            {
                titleKey: "accountingTaxCurrency",
                items: [
                    { titleKey: "taxTypes", href: "/accounting/tax-types", icon: Percent },
                    { titleKey: "taxCalculator", href: "/accounting/tax-calculator", icon: Calculator },
                    { titleKey: "currencies", href: "/accounting/currencies", icon: Wallet },
                    { titleKey: "exchangeRates", href: "/accounting/exchange-rates", icon: ArrowLeftRight },
                ],
            },
            {
                titleKey: "accountingReports",
                items: [
                    { titleKey: "baBs", href: "/accounting/ba-bs", icon: FileDigit },
                    { titleKey: "inflationCoefficients", href: "/accounting/inflation-coefficients", icon: TrendingUp },
                ],
            },
        ],
    },
    {
        id: "hr",
        titleKey: "hr",
        icon: UserCheck,
        items: [
            { titleKey: "employees", href: "/hr/employees", icon: UserCheck },
            { titleKey: "departments", href: "/hr/departments", icon: Building2 },
            { titleKey: "leaveRequests", href: "/hr/leave", icon: CalendarDays },
        ],
    },
    {
        id: "finance",
        titleKey: "finance",
        icon: Wallet,
        subGroups: [
            {
                titleKey: "commercial",
                items: [
                    { titleKey: "invoices", href: "/finance/invoices", icon: Receipt },
                    { titleKey: "orders", href: "/finance/orders", icon: ShoppingCart },
                    { titleKey: "transactions", href: "/finance/transactions", icon: ArrowLeftRight },
                ],
            },
            {
                titleKey: "accountingReports", // Still reusing this key for the finance reports
                items: [
                    { titleKey: "incomeStatement", href: "/finance/reports/income-statement", icon: BarChart3 },
                    { titleKey: "balanceSheet", href: "/finance/reports/balance-sheet", icon: BarChart3 },
                ],
            },
        ],
    },
    {
        id: "settings",
        titleKey: "settings",
        href: "/settings",
        icon: Settings,
        bottom: true,
        items: [
            { titleKey: "settings", href: "/settings", icon: Settings },
            { titleKey: "profile", href: "/settings/profile", icon: UserCircle },
            { titleKey: "activityLog", href: "/settings/activity", icon: Activity },
        ]
    },
]

// ─── Components ───────────────────────────────────────────────────────

export function Sidebar() {
    const pathname = usePathname()
    const t = useTranslations("sidebar")
    
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
    const [flyoutPosition, setFlyoutPosition] = useState(0)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = (id: string, e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        const rect = e.currentTarget.getBoundingClientRect()
        // Try to center the flyout on the item, but ensure it doesn't overflow screen top/bottom
        setFlyoutPosition(rect.top)
        setHoveredGroup(id)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setHoveredGroup(null)
        }, 150) // small delay to allow moving mouse to flyout
    }

    const handleFlyoutMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    const handleFlyoutMouseLeave = () => {
        handleMouseLeave()
    }

    const topGroups = navGroups.filter(g => !g.bottom)
    const bottomGroups = navGroups.filter(g => g.bottom)

    const isGroupActive = (group: NavGroup) => {
        if (group.href && (pathname === group.href || pathname.startsWith(group.href + "/"))) return true
        if (group.items?.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))) return true
        if (group.subGroups?.some(sg => sg.items.some(i => pathname === i.href || pathname.startsWith(i.href + "/")))) return true
        return false
    }

    return (
        <div className="relative z-50 h-full flex">
            {/* The Thin Rail */}
            <div 
                ref={sidebarRef}
                className="w-[88px] h-full bg-background border-r flex flex-col items-center py-4 z-40 relative shadow-sm"
            >
                {/* Logo */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-8 shrink-0 relative overflow-hidden group">
                    <Briefcase className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Top Nav Items */}
                <div className="flex-1 flex flex-col gap-3 w-full px-3">
                    {topGroups.map(group => {
                        const active = isGroupActive(group)
                        const Icon = group.icon
                        
                        const commonProps = {
                            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => handleMouseEnter(group.id, e),
                            onMouseLeave: handleMouseLeave,
                            className: cn(
                                "w-full py-3 min-h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none",
                                active 
                                    ? "bg-primary/15 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] ring-1 ring-primary/20" 
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )
                        }

                        if (group.href) {
                            return (
                                <div key={group.id} className="relative w-full">
                                    <Link href={group.href} {...commonProps}>
                                        <Icon className="h-5 w-5" />
                                        <span className="text-[11px] font-medium leading-none max-w-[95%] text-center">
                                            {t(group.titleKey)}
                                        </span>
                                    </Link>
                                </div>
                            )
                        }

                        return (
                            <div key={group.id} className="relative w-full">
                                <button {...commonProps}>
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[11px] font-medium leading-none max-w-[95%] text-center">
                                        {t(group.titleKey)}
                                    </span>
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Bottom Nav Items */}
                <div className="flex flex-col gap-3 w-full px-3 mt-auto shrink-0">
                    {bottomGroups.map(group => {
                        const active = isGroupActive(group)
                        const Icon = group.icon
                        
                        const commonProps = {
                            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => handleMouseEnter(group.id, e),
                            onMouseLeave: handleMouseLeave,
                            className: cn(
                                "w-full py-3 min-h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none",
                                active 
                                    ? "bg-primary/15 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] ring-1 ring-primary/20" 
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )
                        }

                        if (group.href) {
                            return (
                                <div key={group.id} className="relative w-full">
                                    <Link href={group.href} {...commonProps}>
                                        <Icon className="h-5 w-5" />
                                        <span className="text-[11px] font-medium leading-none max-w-[95%] text-center">
                                            {t(group.titleKey)}
                                        </span>
                                    </Link>
                                </div>
                            )
                        }

                        return (
                            <div key={group.id} className="relative w-full">
                                <button {...commonProps}>
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[11px] font-medium leading-none max-w-[95%] text-center">
                                        {t(group.titleKey)}
                                    </span>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* The Flyout Panel */}
            <AnimatePresence>
                {hoveredGroup && (
                    <FlyoutMenu 
                        group={navGroups.find(g => g.id === hoveredGroup)!} 
                        position={flyoutPosition}
                        onMouseEnter={handleFlyoutMouseEnter}
                        onMouseLeave={handleFlyoutMouseLeave}
                        pathname={pathname}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function FlyoutMenu({ 
    group, 
    position, 
    onMouseEnter, 
    onMouseLeave,
    pathname,
    t
}: { 
    group: NavGroup, 
    position: number,
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    pathname: string,
    t: (k: string) => string
}) {
    // Determine if this group has submenus
    const hasItems = group.items && group.items.length > 0
    const hasSubGroups = group.subGroups && group.subGroups.length > 0

    // Hooks MUST run unconditionally and in the same order on every render.
    // The "no children" early-return therefore happens AFTER all hooks below.
    const menuRef = useRef<HTMLDivElement>(null)
    const [actualTop, setActualTop] = useState<number | null>(null)

    // Calculate vertical alignment precisely based on actual rendered height
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const height = rect.height
            const windowHeight = window.innerHeight
            
            // Center of the sidebar item is position + 36 (since item height is ~72)
            const idealTop = position + 36 - (height / 2)
            
            // Clamp so it doesn't overflow the top (16px margin) or bottom (16px margin)
            const clampedTop = Math.max(16, Math.min(idealTop, windowHeight - height - 16))
            setActualTop(clampedTop)
        }
    }, [position, group.id])

    // Do not show flyout if it's just a direct link with no children.
    if (!hasItems && !hasSubGroups) return null

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: -10, scale: 0.98 }}
            animate={{ opacity: actualTop !== null ? 1 : 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ 
                top: actualTop !== null ? actualTop : -9999, // Hide completely until measured
                visibility: actualTop !== null ? "visible" : "hidden",
                left: 88 + 8 // 88px rail width + 8px gap
            }}
            className="fixed z-50 w-[240px] md:w-[260px] bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-32px)]"
        >
            <div className="p-3 border-b bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <group.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-[15px]">{t(group.titleKey)}</h3>
                </div>
            </div>
            
            <ScrollArea className="flex-1 overflow-y-auto p-2.5">
                <div className="flex flex-col gap-3">
                    {/* Render direct items */}
                    {hasItems && (
                        <div className="flex flex-col gap-0.5">
                            {group.items!.map(item => (
                                <FlyoutLink key={item.href} item={item} pathname={pathname} t={t} />
                            ))}
                        </div>
                    )}

                    {/* Render sub-groups */}
                    {hasSubGroups && group.subGroups!.map(sub => (
                        <div key={sub.titleKey} className="flex flex-col gap-0.5">
                            <h4 className="px-3 py-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                {t(sub.titleKey)}
                            </h4>
                            {sub.items.map(item => (
                                <FlyoutLink key={item.href} item={item} pathname={pathname} t={t} />
                            ))}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </motion.div>
    )
}

function FlyoutLink({ item, pathname, t }: { item: NavItem, pathname: string, t: (k: string) => string }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon
    
    return (
        <Link
            href={item.href}
            className={cn(
                "group flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 outline-none",
                isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
        >
            <Icon className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
            )} />
            <span className="text-[13px]">{t(item.titleKey)}</span>
            {isActive && (
                <motion.div 
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                />
            )}
        </Link>
    )
}

// ─── Mobile Sidebar (Sheet-based) ─────────────────────────────────────

export function MobileSidebar() {
    const [openPath, setOpenPath] = useState<string | null>(null)
    const tCommon = useTranslations("common")
    const t = useTranslations("sidebar")
    const pathname = usePathname()
    const open = openPath === pathname

    return (
        <Sheet open={open} onOpenChange={(nextOpen) => setOpenPath(nextOpen ? pathname : null)}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 relative z-50">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-background/95 backdrop-blur-xl">
                <SheetTitle className="sr-only">{tCommon("appName")} Navigation</SheetTitle>
                <div className="flex h-16 items-center gap-3 border-b px-6 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Briefcase className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold">
                        {tCommon("appName")}
                    </span>
                </div>
                <ScrollArea className="flex-1 py-4 px-3">
                    <div className="flex flex-col gap-6 pb-20">
                        {navGroups.map(group => (
                            <div key={group.id} className="flex flex-col gap-2">
                                <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {/* Using useTranslations hooks directly inside map is tricky without passing t, so we assume we have t from a hook at component level. Let's fix this inside the component body by calling useTranslations early. */}
                                </h4>
                                {/* Mobile view needs a slightly different structure. I'll just render everything flat. */}
                                <MobileNavGroup group={group} pathname={pathname} sidebarT={t} />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

function MobileNavGroup({ group, pathname, sidebarT }: { group: NavGroup, pathname: string, sidebarT: (k: string) => string }) {
    const t = sidebarT
    const hasItems = group.items && group.items.length > 0
    const hasSubGroups = group.subGroups && group.subGroups.length > 0

    if (!hasItems && !hasSubGroups && group.href) {
        const isActive = pathname === group.href || pathname.startsWith(group.href + "/")
        const Icon = group.icon
        return (
            <Link
                href={group.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                )}
            >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{t(group.titleKey)}</span>
            </Link>
        )
    }

    return (
        <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <group.icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider">{t(group.titleKey)}</h4>
            </div>
            
            {hasItems && group.items!.map(item => (
                <MobileNavLink key={item.href} item={item} pathname={pathname} t={t} />
            ))}

            {hasSubGroups && group.subGroups!.map(sub => (
                <div key={sub.titleKey} className="flex flex-col gap-1 mt-2 pl-3 border-l-2 border-muted/50 ml-5">
                    <h5 className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {t(sub.titleKey)}
                    </h5>
                    {sub.items.map(item => (
                        <MobileNavLink key={item.href} item={item} pathname={pathname} t={t} />
                    ))}
                </div>
            ))}
        </div>
    )
}

function MobileNavLink({ item, pathname, t }: { item: NavItem, pathname: string, t: (k: string) => string }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon
    
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
            )}
        >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{t(item.titleKey)}</span>
        </Link>
    )
}
