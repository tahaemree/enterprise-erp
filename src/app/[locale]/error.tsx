"use client"

import { useEffect } from "react"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error:", error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 page-enter">
            <div className="glass-strong card-lift max-w-md rounded-2xl p-8 text-center shadow-2xl ring-1 ring-border/50">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-inner">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground">Beklenmeyen Hata</h1>
                <p className="mb-8 text-base text-muted-foreground">
                    Sistemimizde beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button onClick={() => reset()} variant="default" className="w-full sm:w-auto shadow-md">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Tekrar Dene
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Ana Sayfa
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
