"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("sse")

export function SseProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status !== "authenticated") return

        const eventSource = new EventSource("/api/notifications/sse")

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                
                if (data.type === "ping") {
                    return // Connection alive
                }

                // Show toast for new notification
                toast(data.title, {
                    description: data.description,
                    position: "top-right",
                })
                
                // You could also dispatch this to a global store (zustand) if you want to update the header badge live without a refresh,
                // but since Next.js Server Actions with revalidatePath refreshes the RSC tree, 
                // the header might automatically re-fetch if it's a Server Component.
                // Our Header is a Client Component that fetches on mount, so it needs manual update or we can just rely on the toast.
            } catch (err) {
                logger.error("SSE parse error", { error: err instanceof Error ? { message: err.message, name: err.name } : String(err) })
            }
        }

        eventSource.onerror = (error) => {
            logger.error("SSE connection error", { error: String(error) })
            eventSource.close()
        }

        return () => {
            eventSource.close()
        }
    }, [status])

    return <>{children}</>
}
