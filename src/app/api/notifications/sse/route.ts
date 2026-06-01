import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { sseEmitter } from "@/lib/sse-emitter"

export async function GET(req: NextRequest) {
    let session;
    try {
        session = await requireAuth()
    } catch {
        return new Response("Unauthorized", { status: 401 })
    }

    const { tenantId, id: userId } = session

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        start(controller) {
            const listener = (eventTenantId: string, eventUserId: string, payload: Record<string, unknown>) => {
                // If the notification is for this tenant, and either for this specific user or all users (userId = "*")
                if (eventTenantId === tenantId && (eventUserId === userId || eventUserId === "*")) {
                    const data = `data: ${JSON.stringify(payload)}\n\n`
                    try {
                        controller.enqueue(encoder.encode(data))
                    } catch (e) {
                        sseEmitter.off("notification", listener)
                    }
                }
            }

            const cleanup = () => {
                sseEmitter.off("notification", listener)
            }

            sseEmitter.on("notification", listener)

            // Send initial connection successful ping
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))

            // Keep connection alive and detect dropped clients
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: keep-alive\n\n`))
                } catch (e) {
                    cleanup()
                    clearInterval(pingInterval)
                }
            }, 15000)

            // Cleanup when stream closes normally or abnormally
            req.signal.addEventListener("abort", () => {
                cleanup()
                clearInterval(pingInterval)
            })
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    })
}
