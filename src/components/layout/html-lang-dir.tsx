"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"

export function HtmlLangDirSetter() {
    const locale = useLocale()
    const direction = locale === "ar" ? "rtl" : "ltr"

    useEffect(() => {
        document.documentElement.lang = locale
        document.documentElement.dir = direction
    }, [locale, direction])

    return null
}
