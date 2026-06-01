import { EventEmitter } from "events"

// Global singleton for SSE events
const globalForSse = global as unknown as { sseEmitter: EventEmitter }

export const sseEmitter =
    globalForSse.sseEmitter ||
    new EventEmitter()

// Increase listener limit to prevent warnings with many active clients
sseEmitter.setMaxListeners(100)

if (process.env.NODE_ENV !== "production") globalForSse.sseEmitter = sseEmitter
