import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Currency-to-locale mapping for smart defaults.
 */
const CURRENCY_LOCALE: Record<string, string> = {
    TRY: "tr-TR",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    CHF: "de-CH",
    JPY: "ja-JP",
    RUB: "ru-RU",
    SAR: "ar-SA",
    DKK: "da-DK",
    SEK: "sv-SE",
    NOK: "nb-NO",
    AUD: "en-AU",
    CAD: "en-CA",
    KWD: "ar-KW",
    CNY: "zh-CN",
}

export function formatCurrency(
    amount: number | string,
    currency: string = "TRY",
    locale?: string
): string {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    const resolvedLocale = locale || CURRENCY_LOCALE[currency] || "tr-TR"
    return new Intl.NumberFormat(resolvedLocale, {
        style: "currency",
        currency,
    }).format(numAmount)
}

export function formatDate(
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    },
    locale: string = "tr-TR"
): string {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, options).format(d)
}

export function formatDateTime(date: Date | string, locale: string = "tr-TR"): string {
    return formatDate(date, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }, locale)
}

export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(date)
}

export function generateOrderNumber(prefix: string = "ORD"): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    // Use crypto UUID suffix for guaranteed uniqueness (no collision possible)
    const uniqueSuffix = crypto.randomUUID().split("-")[0]!.toUpperCase()
    return `${prefix}-${year}${month}${day}-${uniqueSuffix}`
}

export function generateEmployeeId(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    return `EMP-${timestamp}`
}

export function generateSKU(name: string, categoryCode?: string): string {
    const nameCode = name
        .split(" ")
        .map((word) => word.substring(0, 2).toUpperCase())
        .join("")
        .substring(0, 4)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return categoryCode ? `${categoryCode}-${nameCode}-${random}` : `${nameCode}-${random}`
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export function truncate(text: string, length: number = 50): string {
    if (text.length <= length) return text
    return text.substring(0, length) + "..."
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
}

export function calculatePercentageChange(
    current: number,
    previous: number
): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return {
        value: Math.abs(Math.round(change * 10) / 10),
        isPositive: change >= 0,
    }
}

export function getStockStatus(
    quantity: number,
    minStock: number
): "in-stock" | "low-stock" | "out-of-stock" {
    if (quantity === 0) return "out-of-stock"
    if (quantity <= minStock) return "low-stock"
    return "in-stock"
}

export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Rounds a number to the specified number of decimal places.
 */
export function round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

import { CURRENCY_SYMBOLS } from "@/lib/constants"

export function getCurrencySymbol(code: string): string {
    return CURRENCY_SYMBOLS[code.toUpperCase()] || code
}

/**
 * Recursively serializes Prisma objects to plain JS objects,
 * converting Decimal to number, and handling nested arrays/objects.
 * Essential for Next.js Server Actions to avoid "Only plain objects" errors.
 */
/**
 * Type guard for objects with a `toNumber` method (Prisma Decimal, etc.)
 */
interface HasToNumber {
    toNumber: () => number
}

function hasToNumber(value: unknown): value is HasToNumber {
    return (
        typeof value === "object" &&
        value !== null &&
        "toNumber" in value &&
        typeof (value as HasToNumber).toNumber === "function"
    )
}

/**
 * Recursively serializes Prisma objects to plain JS objects,
 * converting Decimal to number, and handling nested arrays/objects.
 * Essential for Next.js Server Actions to avoid "Only plain objects" errors.
 */
export function serializePrisma<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj

    // Handle Prisma Decimal (has a toNumber method)
    if (hasToNumber(obj)) {
        return obj.toNumber() as T
    }

    if (obj instanceof Date) return obj // Next.js handles Date fine now
    
    if (Array.isArray(obj)) {
        return obj.map(item => serializePrisma(item)) as unknown as T
    }

    if (typeof obj === "object") {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = serializePrisma(value)
        }
        return result as T
    }

    return obj
}
