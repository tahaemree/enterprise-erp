import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withSentryConfig } from "@sentry/nextjs"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const isProd = process.env.NODE_ENV === "production"

/**
 * Content-Security-Policy.
 *
 * In development, Next.js' React Fast Refresh and dev tooling require
 * `'unsafe-eval'` and a websocket connection to localhost for HMR.
 * In production we drop both: `'unsafe-eval'` is removed and `connect-src`
 * is restricted to same-origin + the Sentry ingest endpoint.
 *
 * NOTE: `'unsafe-inline'` on `script-src` is still required because Next.js
 * injects inline bootstrap scripts without a nonce. Migrating to a
 * nonce-based CSP (via middleware) is tracked as a follow-up hardening task.
 */
const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

const connectSrc = isProd
    ? "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io"
    : "connect-src 'self' http://localhost:* ws://localhost:* https://*.sentry.io https://*.ingest.sentry.io"

const contentSecurityPolicy = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://flagcdn.com https://cdn.jsdelivr.net",
    "font-src 'self' data:",
    connectSrc,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
].join("; ")

const securityHeaders = [
    {
        key: "X-DNS-Prefetch-Control",
        value: "on",
    },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
    },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    {
        key: "X-XSS-Protection",
        value: "1; mode=block",
    },
    {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy,
    },
]

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net",
                pathname: "/gh/hatscripts/circle-flags@gh-pages/flags/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ]
    },
    poweredByHeader: false,
}

export default withSentryConfig(
    withNextIntl(nextConfig),
    {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        silent: true,
        org: "deftra",
        project: "deftra-erp",
        tunnelRoute: "/monitoring",
        // Turbopack does not support automatic Vercel monitor creation.
        // Configure Sentry monitors in Sentry/Vercel instead of using the deprecated top-level option.
        webpack: {
            treeshake: {
                removeDebugLogging: true,
            },
        },
    }
)
