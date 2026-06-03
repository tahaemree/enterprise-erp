"use client"

import { useTranslations } from "next-intl"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const t = useTranslations("common")
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Keyboard skip-link: first focusable element jumps past the chrome
                straight to the main content (WCAG 2.4.1 Bypass Blocks). */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {t("skipToContent")}
            </a>

            {/* Desktop Sidebar (Fixed 72px rail) */}
            <nav aria-label="Sidebar navigation" className="hidden md:flex md:min-h-0 z-[60]">
                <Sidebar />
            </nav>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none" aria-label="Main content">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
