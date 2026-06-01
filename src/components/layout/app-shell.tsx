"use client"

import { Sidebar, MobileSidebar } from "./sidebar"
import { Header } from "./header"

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar (Fixed 72px rail) */}
            <nav aria-label="Sidebar navigation" className="hidden md:flex md:min-h-0 z-[60]">
                <Sidebar />
            </nav>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main id="main-content" className="flex-1 overflow-y-auto" aria-label="Main content">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
