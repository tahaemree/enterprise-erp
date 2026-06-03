"use client"

import {
    ShoppingCart,
    UserPlus,
    Package,
    FileText,
    DollarSign,
    UserCheck,
    Activity,
    ArrowRight,
    CalendarDays,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { cn, formatRelativeTime, getInitials } from "@/lib/utils"

interface ActivityItem {
    id: string
    action: string
    entityType: string
    description: string
    user: string
    createdAt: Date
}

interface ActivityFeedProps {
    activities?: ActivityItem[]
}

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    order: {
        icon: ShoppingCart,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/40",
    },
    customer: {
        icon: UserPlus,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/40",
    },
    product: {
        icon: Package,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/40",
    },
    invoice: {
        icon: FileText,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/40",
    },
    payment: {
        icon: DollarSign,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
    },
    leave: {
        icon: CalendarDays,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-100 dark:bg-indigo-900/40",
    },
    employee: {
        icon: UserCheck,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-100 dark:bg-rose-900/40",
    },
    default: {
        icon: Activity,
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-800",
    },
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
    const t = useTranslations("dashboard")
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        {t("recentActivity")}
                    </CardTitle>
                    <CardDescription>{t("latestActivity")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href="/" className="flex items-center gap-1">
                        {t("viewAll")}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-1">
                        {activities.length > 0 ? (
                            activities.map((activity, idx) => {
                                const { icon: Icon, color, bg } = (iconMap[activity.entityType] ?? iconMap.default)!
                                const isLast = idx === activities.length - 1
                                return (
                                    <div
                                        key={activity.id}
                                        className="relative flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60"
                                    >
                                        {/* Timeline connector */}
                                        {!isLast && (
                                            <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                                        )}
                                        <div className={cn("rounded-full p-2 shrink-0", bg)}>
                                            <Icon className={cn("h-3.5 w-3.5", color)} />
                                        </div>
                                        <div className="flex-1 space-y-0.5 min-w-0">
                                            <p className="text-sm leading-snug">
                                                {activity.description}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                                <Avatar className="h-4 w-4">
                                                    <AvatarFallback className="text-[8px]">
                                                        {getInitials(activity.user)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{activity.user}</span>
                                                <span>·</span>
                                                <span>{formatRelativeTime(activity.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                                {t("noRecentActivity")}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}


