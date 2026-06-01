"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { ReactNode } from "react"
import type { Session } from "next-auth"

export function Providers({ children, session }: { children: ReactNode, session?: Session | null }) {
    return (
        <SessionProvider session={session}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <TooltipProvider delayDuration={0}>
                    {children}
                </TooltipProvider>
            </ThemeProvider>
        </SessionProvider>
    )
}
