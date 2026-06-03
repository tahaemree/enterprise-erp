/**
 * Deftra — Request Correlation Context (server-only)
 *
 * Provides a stable correlation id for the current request so that logs, error
 * responses, and downstream calls can all be tied back to a single user action.
 *
 * The id is sourced from the inbound `x-request-id` header (set by the proxy /
 * upstream load balancer) and falls back to a freshly generated UUID. It is
 * memoized per render pass via React.cache, so every call within the same
 * request returns the same id.
 *
 * Access to `next/headers` is wrapped defensively: outside a request scope
 * (unit tests, scripts, build) it simply returns a generated id instead of
 * throwing.
 */
import { cache } from "react"
import { randomUUID } from "crypto"

export const REQUEST_ID_HEADER = "x-request-id"

export const getRequestId = cache(async function getRequestId(): Promise<string> {
    try {
        const { headers } = await import("next/headers")
        const headerList = await headers()
        return headerList.get(REQUEST_ID_HEADER) ?? randomUUID()
    } catch {
        // No request scope (tests, scripts, build-time evaluation).
        return randomUUID()
    }
})
