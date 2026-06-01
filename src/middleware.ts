import NextAuth from "next-auth"
import authConfig from "../auth.config"
import createIntlMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { routing } from "./i18n/routing"

const { auth } = NextAuth(authConfig)
const intlMiddleware = createIntlMiddleware(routing)

/**
 * Precomputed set of all public page paths with all locale prefixes.
 * This replaces the O(n) loop in isPublicPage() with an O(1) Set lookup.
 */
const PUBLIC_PAGES = new Set(["/", "/login"])
const localePrefixes = routing.locales.map((l) => `/${l}`)

// Precompute all locale-prefixed public paths into a single Set
const PUBLIC_PATHS = new Set<string>()
for (const prefix of localePrefixes) {
    for (const page of PUBLIC_PAGES) {
        PUBLIC_PATHS.add(`${prefix}${page === "/" ? "" : page}`)
    }
}

// Also add the unprefixed versions
for (const page of PUBLIC_PAGES) {
    PUBLIC_PATHS.add(page)
}

/**
 * Optimized middleware: single-pass auth + i18n handling.
 * Precomputed PUBLIC_PATHS Set enables O(1) public page lookups.
 */
const authMiddleware = auth((req) => {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth

    // Allow API auth routes to pass through without i18n middleware
    if (pathname.startsWith("/api/auth")) {
        return
    }

    const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ""))

    if (isPublic) {
        // If logged in and trying to access login page, redirect to dashboard
        if (isLoggedIn && (pathname.endsWith("/login") || pathname.endsWith("/login/"))) {
            // Preserve the current locale
            const locale = localePrefixes.find((p) => pathname.startsWith(p))?.slice(1) || routing.defaultLocale
            return Response.redirect(new URL(`/${locale}/dashboard`, req.url))
        }
        return intlMiddleware(req)
    }

    // Protected route — require authentication
    if (!isLoggedIn) {
        const locale = localePrefixes.find((p) => pathname.startsWith(p))?.slice(1) || routing.defaultLocale
        return Response.redirect(new URL(`/${locale}/login`, req.url))
    }

    return intlMiddleware(req)
})

export default function middleware(req: NextRequest, _event: unknown) {
    // next-auth beta has a bug where it overrides redirect statuses (e.g. from 307 to 404)
    // Also, next-intl middleware might fail to redirect the root path if wrapped or matched strangely.
    // Manually redirect the root path to the default locale.
    if (req.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL(`/${routing.defaultLocale}`, req.url))
    }
    return (authMiddleware as (req: NextRequest, event: unknown) => Response | NextResponse | void)(req, _event)
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
