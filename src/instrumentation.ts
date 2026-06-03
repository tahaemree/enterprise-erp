/**
 * Next.js instrumentation hook.
 *
 * `register()` runs exactly once when the server process boots — before any
 * request is served. We use it to fail fast on a misconfigured production
 * environment so the app refuses to start with weak/missing secrets instead of
 * crashing deep under load on the first encryption or auth call.
 *
 * Guards:
 *   - Skipped during the production *build* phase, where runtime secrets are
 *     intentionally absent in CI.
 *   - Restricted to the Node.js runtime; the Edge runtime has no access to the
 *     full secret set and runs a different code path.
 */
export async function register() {
    if (process.env.NEXT_PHASE === "phase-production-build") return
    if (process.env.NEXT_RUNTIME !== "nodejs") return

    const { assertEnv } = await import("@/lib/env")
    assertEnv()
}
