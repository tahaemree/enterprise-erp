"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useTransition } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { locales } from "@/i18n/routing"

const LANGUAGE_NAMES: Record<string, { native: string; english: string; code: string }> = {
    tr: { native: "Türkçe", english: "Turkish", code: "tr" },
    en: { native: "English", english: "English", code: "gb" },
    de: { native: "Deutsch", english: "German", code: "de" },
    ar: { native: "العربية", english: "Arabic", code: "sa" },
}

export function LanguageSwitcher() {
    const locale = useLocale()
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const t = useTranslations("header")

    const handleLanguageChange = (newLocale: string) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale })
            router.refresh()
        })
    }

    const currentLang = LANGUAGE_NAMES[locale] || LANGUAGE_NAMES["en"]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-accent/50"
                    disabled={isPending}
                >
                    <Image
                        src={`https://cdn.jsdelivr.net/gh/hatscripts/circle-flags@gh-pages/flags/${currentLang?.code || "gb"}.svg`}
                        alt={currentLang?.english || "English"}
                        width={20}
                        height={20}
                        unoptimized
                        className="w-5 h-5 object-cover rounded-full shadow-sm"
                    />
                    <span className="sr-only">{t("language")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {locales.map((loc) => {
                    const lang = LANGUAGE_NAMES[loc]
                    if (!lang) return null
                    return (
                        <DropdownMenuItem
                            key={loc}
                            onClick={() => handleLanguageChange(loc)}
                            className={`flex items-center gap-3 cursor-pointer ${
                                locale === loc ? "bg-accent font-medium" : ""
                            }`}
                        >
                            <Image
                                src={`https://cdn.jsdelivr.net/gh/hatscripts/circle-flags@gh-pages/flags/${lang.code}.svg`}
                                alt={lang.english}
                                width={20}
                                height={20}
                                unoptimized
                                className="w-5 h-5 object-cover rounded-full shadow-sm"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm leading-tight">{lang.native}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {lang.english}
                                </span>
                            </div>
                            {locale === loc && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
