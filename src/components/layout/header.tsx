"use client"

import { useTheme } from "@teispace/next-themes"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Bell, Moon, Sun, Search, Menu, LogOut, User, Settings, CreditCard, CheckCheck } from "lucide-react"
import Link from "next/link"
import { getNotifications, markAllAsRead } from "@/lib/actions/notifications"
import { Button } from "@/components/ui/button"
import { CommandPalette } from "@/components/layout/command-palette"
import { MobileSidebar } from "@/components/layout/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"

interface NotificationItem {
    id: string
    title: string
    description: string | null
    color: string
    time: string
}

export function Header() {
    const { theme, setTheme } = useTheme()
    const { data: session } = useSession()
    const t = useTranslations("header")

    const [notifs, setNotifs] = useState<NotificationItem[]>([])

    useEffect(() => {
        getNotifications().then(res => {
            if (res.ok && res.data) {
                const formatted: NotificationItem[] = res.data.map((n: { id: string; title: string; description: string | null; color: string | null }) => ({
                    id: n.id,
                    title: n.title,
                    description: n.description,
                    color: n.color || "bg-blue-500",
                    time: t("new") || "Yeni"
                }))
                setNotifs(formatted)
            }
        })
    }, [])

    const handleMarkAllRead = async () => {
        const res = await markAllAsRead()
        if (res.ok) {
            setNotifs([])
        }
    }

    // Derive initials and display name from session
    const userName = session?.user?.name || "User"
    const userEmail = session?.user?.email || "user@example.com"
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-6 shadow-sm">
            {/* Left section */}
            <div className="flex items-center gap-4">
                <MobileSidebar />

                {/* Search Bar / Command Palette */}
                <div className="hidden md:flex relative group">
                    <CommandPalette />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => {
                        if (!document.startViewTransition) {
                            setTheme(theme === "dark" ? "light" : "dark")
                            return
                        }
                        document.startViewTransition(() => {
                            setTheme(theme === "dark" ? "light" : "dark")
                        })
                    }}
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t("toggleTheme")}</span>
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {notifs.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute top-1 right-1.5 h-4 min-w-[16px] rounded-full px-1 flex items-center justify-center text-[10px] font-bold border-2 border-background shadow-sm"
                                >
                                    {notifs.length}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <span className="text-sm font-semibold">{t("notifications")}</span>
                            {notifs.length > 0 && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={handleMarkAllRead}>
                                    <CheckCheck className="mr-1 h-3 w-3" />
                                    {t("markAllRead")}
                                </Button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifs.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {t("noNewNotifications")}
                                </div>
                            ) : (
                                notifs.map((notif, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b last:border-b-0"
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.color}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.description}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{notif.time}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="border-t p-2">
                            <Button variant="ghost" size="sm" className="w-full h-8 text-xs" asChild>
                                <Link href="/notifications">{t("viewAll", { fallback: "View All" })}</Link>
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                            <Avatar className="h-9 w-9 ring-2 ring-muted transition-all hover:ring-primary">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-1 rounded-xl" sideOffset={8}>
                        <div className="flex items-center justify-start gap-3 p-2">
                            <Avatar className="h-10 w-10 border border-primary/10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1 leading-none">
                                <p className="text-sm font-semibold">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userEmail}</p>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer py-2" asChild>
                            <Link href="/settings/profile" className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{t("profile", { fallback: "Profile" })}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer py-2" asChild>
                            <Link href="/settings" className="flex items-center w-full">
                                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="flex-1">{t("settings", { fallback: "Settings" })}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer py-2">
                            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="flex-1">{t("billing", { fallback: "Billing" })}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer py-2 text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-300">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t("signOut")}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
