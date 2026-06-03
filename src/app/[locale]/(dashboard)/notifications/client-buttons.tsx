"use client"

import { Button } from "@/components/ui/button"
import { markAllAsRead, markAsRead } from "@/lib/actions/notifications"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

export function MarkAllReadButton() {
    const t = useTranslations("notifications")
    const [isPending, setIsPending] = useState(false)

    const handleMarkAll = async () => {
        setIsPending(true)
        try {
            await markAllAsRead()
            toast.success(t("allMarkedRead", { fallback: "All notifications marked as read." }))
        } catch (_error) {
            toast.error("Failed to mark notifications as read")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={isPending}>
            <Check className="w-4 h-4 mr-2" />
            {t("markAllAsRead", { fallback: "Mark all as read" })}
        </Button>
    )
}

export function MarkReadButton({ id }: { id: string }) {
    const t = useTranslations("notifications")
    const [isPending, setIsPending] = useState(false)

    const handleMark = async () => {
        setIsPending(true)
        try {
            await markAsRead(id)
        } catch (_error) {
            toast.error("Failed to mark as read")
            setIsPending(false) // Only reset if failed, otherwise it stays disabled
        }
    }

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            title={t("markAsRead", { fallback: "Mark as read" })} 
            onClick={handleMark}
            disabled={isPending}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
            <Check className="w-4 h-4" />
        </Button>
    )
}
