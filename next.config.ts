import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { withSentryConfig } from "@sentry/nextjs"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

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
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://flagcdn.com https://cdn.jsdelivr.net; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*; frame-ancestors 'none'; form-action 'self'",
    },
]

const nextConfig: NextConfig = {
    output: "standalone",
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
        automaticVercelMonitors: true,
        webpack: {
            treeshake: {
                removeDebugLogging: true,
            },
        },
    }
)

