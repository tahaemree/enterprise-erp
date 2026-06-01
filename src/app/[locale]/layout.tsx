import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ZodI18nProvider } from "@/components/providers/zod-i18n-provider"
import { Toaster } from "@/components/ui/sonner"
import { notFound } from "next/navigation"
import { HtmlLangDirSetter } from "@/components/layout/html-lang-dir"
import { routing, locales, type Locale } from "@/i18n/routing"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "common" })

    // Build hreflang alternates for all supported locales
    const languages: Record<string, string> = {}
    for (const l of locales) {
        languages[l] = `/${l}`
    }
    // Add x-default (can point to default locale)
    languages["x-default"] = "/tr"

    return {
        title: {
            template: `%s | ${t("appName")}`,
            default: `${t("appName")} - ${t("appDescription")}`,
        },
        description: t("appDescription"),
        alternates: {
            canonical: `/${locale}`,
            languages,
        },
    }
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    // Validate locale
    if (!routing.locales.includes(locale as Locale)) {
        notFound()
    }

    const messages = await getMessages()

    return (
        <NextIntlClientProvider messages={messages}>
            <ZodI18nProvider>
                <HtmlLangDirSetter />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="top-right" richColors />
                </ThemeProvider>
            </ZodI18nProvider>
        </NextIntlClientProvider>
    )
}
