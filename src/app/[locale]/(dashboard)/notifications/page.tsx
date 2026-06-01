import { getAllNotifications, markAllAsRead } from "@/lib/actions/notifications"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, Circle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import Link from "next/link"
import { MarkAllReadButton, MarkReadButton } from "./client-buttons"

export default async function NotificationsPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const t = await getTranslations("notifications")
    const result = await getAllNotifications()
    const notifications = result.ok ? result.data : []
    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t("title", { fallback: "Notifications Center" })}</h2>
                    <p className="text-muted-foreground">
                        {t("description", { fallback: "View and manage your system notifications." })}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <MarkAllReadButton />
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t("recentNotifications", { fallback: "Recent Notifications" })}</span>
                        <Badge variant="secondary" className="font-normal">
                            {unreadCount} {t("unread", { fallback: "unread" })}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {notifications.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id} 
                                    className={`p-4 flex gap-4 transition-colors hover:bg-muted/50 ${!notification.isRead ? "bg-primary/5" : ""}`}
                                >
                                    <div className="mt-1">
                                        {!notification.isRead ? (
                                            <Circle className="w-2.5 h-2.5 fill-primary text-primary mt-1" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                                {notification.link ? (
                                                    <Link href={notification.link} className="hover:underline">
                                                        {notification.title}
                                                    </Link>
                                                ) : (
                                                    notification.title
                                                )}
                                            </p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notification.createdAt), { 
                                                    addSuffix: true,
                                                    locale: params.locale === 'tr' ? tr : undefined 
                                                })}
                                            </span>
                                        </div>
                                        {notification.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.description}
                                            </p>
                                        )}
                                    </div>
                                    {!notification.isRead && (
                                        <div>
                                            <MarkReadButton id={notification.id} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 text-muted-foreground/30" />
                            <p>{t("noNotifications", { fallback: "You don't have any notifications." })}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''} ${className}`}>{children}</span>
}
