import { defineRouting } from "next-intl/routing"

export const locales = ["en", "tr", "ar", "de"] as const
export type Locale = (typeof locales)[number]

export const routing = defineRouting({
    locales,
    defaultLocale: "tr",
    localePrefix: "always",
    localeDetection: true,
})
