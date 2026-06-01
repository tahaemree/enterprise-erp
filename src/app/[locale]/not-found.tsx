"use client"

import { FileQuestion, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 page-enter">
            <div className="glass-strong card-lift max-w-md rounded-2xl p-8 text-center shadow-2xl ring-1 ring-border/50">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                    <FileQuestion className="h-10 w-10" />
                </div>
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground">404 - Bulunamadı</h1>
                <p className="mb-8 text-base text-muted-foreground">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>
                <div className="flex justify-center">
                    <Button asChild variant="default" className="w-full sm:w-auto shadow-md">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Ana Sayfaya Dön
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
