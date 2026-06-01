"use client"

import { useEffect } from "react"
import { AlertOctagon, RefreshCcw, Home } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Critical Global Error:", error)
    }, [error])

    return (
        <html lang="tr">
            <body className="bg-[var(--background)] text-[var(--foreground)] antialiased min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* Decorative background elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[100px] -z-10" />
                
                <div className="max-w-lg w-full glass-strong rounded-3xl p-10 text-center card-lift animate-slide-up">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] border border-red-500/20">
                        <AlertOctagon className="h-12 w-12" />
                    </div>
                    
                    <h1 className="mb-4 text-4xl font-extrabold tracking-tight">Kritik Sistem Hatası</h1>
                    
                    <p className="mb-10 text-lg text-[var(--muted-foreground)]">
                        Deftra ERP sisteminde beklenmeyen bir hata meydana geldi. Verileriniz güvende, ancak bu işlem tamamlanamadı.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => reset()}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-red-700 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Sayfayı Yenile
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[var(--secondary)] px-6 py-3.5 text-sm font-semibold text-[var(--secondary-foreground)] shadow-sm hover:bg-[var(--secondary)]/80 hover:-translate-y-0.5 transition-all border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Ana Sayfaya Dön
                        </button>
                    </div>
                    {error.digest && (
                        <p className="mt-8 text-xs text-[var(--muted-foreground)]/60 font-mono">
                            Hata Kodu: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    )
}
