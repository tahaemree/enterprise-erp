import type { NextAuthConfig } from "next-auth"
import { routing } from "@/i18n/routing"

export const JWT_MAX_AGE = +(process.env.JWT_MAX_AGE || "86400") // Default: 24 hours

/**
 * Dashboard route prefixes (without locale prefix)
 */
const DASHBOARD_ROUTES = ["/dashboard", "/inventory", "/crm", "/finance", "/hr"]

/**
 * Check if a pathname corresponds to a protected dashboard route.
 * Handles both locale-prefixed (e.g., /en/dashboard) and unprefixed paths.
 */
function isDashboardRoute(pathname: string): boolean {
    // Try matching directly (no locale prefix)
    if (DASHBOARD_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
        return true
    }
    // Try matching with locale prefix (e.g., /en/dashboard)
    for (const locale of routing.locales) {
        const prefixed = `/${locale}/`
        if (pathname.startsWith(prefixed)) {
            const rest = pathname.slice(prefixed.length - 1) // Keep leading slash
            if (DASHBOARD_ROUTES.some((prefix) => rest === prefix || rest.startsWith(prefix + "/"))) {
                return true
            }
        }
    }
    return false
}

/**
 * Extract locale from a locale-prefixed pathname (e.g., /en/dashboard -> "en")
 */
function extractLocale(pathname: string): string {
    for (const locale of routing.locales) {
        if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
            return locale
        }
    }
    return routing.defaultLocale
}

export default {
    providers: [],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign-in: transfer custom fields from User to JWT
            if (account && user) {
                token.id = user.id!
                token.role = user.role!
                token.tenantId = user.tenantId!
                token.permissions = user.permissions || []
            }

            // JWT expiry (used internally by NextAuth for session tokens)
            token.exp = Math.floor(Date.now() / 1000) + JWT_MAX_AGE

            return token
        },
        async session({ session, user, token }) {
            if (session.user) {
                // Database strategy: user comes from PrismaAdapter with all DB fields
                if (user) {
                    session.user.id = user.id!
                    session.user.role = user.role!
                    session.user.tenantId = user.tenantId!
                    session.user.permissions = user.permissions || []
                }
                // JWT strategy: token has custom fields
                else if (token) {
                    session.user.id = token.id!
                    session.user.role = token.role!
                    session.user.tenantId = token.tenantId!
                    session.user.permissions = token.permissions || []
                }
            }
            return session
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const pathname = nextUrl.pathname

            if (isDashboardRoute(pathname)) {
                if (isLoggedIn) return true
                // Return locale-aware redirect instead of false (which would go to /login without locale)
                const locale = extractLocale(pathname)
                return Response.redirect(new URL(`/${locale}/login`, nextUrl))
            }

            // Login page: redirect to dashboard if already logged in
            if (isLoggedIn && (pathname.endsWith("/login") || pathname.endsWith("/login/"))) {
                const locale = extractLocale(pathname)
                return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl))
            }

            return true
        },
    },
} satisfies NextAuthConfig
