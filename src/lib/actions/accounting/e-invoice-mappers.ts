/**
 * Shared EInvoice mapping types and helper functions.
 * Separated from the server action file to avoid Next.js 16 Turbopack
 * restrictions on non-async exports from "use server" files.
 */

import type { Prisma } from "@prisma/client"

// ─── Mapped Types ───────────────────────────────────────────────

export type EInvoiceWithMapped = Prisma.EInvoiceGetPayload<{}> & {
    grossTotal: number
    vatBaseTotal: number
    vatTotal: number
    netTotal: number
    withholdingTotal: number
    exchangeRate: number | null
}

export type EInvoiceDetailWithMapped = EInvoiceWithMapped & {
    accountLines?: Array<unknown>
    order?: unknown
}

// ─── Prisma Include ─────────────────────────────────────────────

export const einvoiceInclude = {
    accountLines: {
        include: {
            costCenter: true,
            bankAccount: true,
        },
    },
    order: true,
} as const

// ─── Mapping Functions ──────────────────────────────────────────

export function mapEInvoice(e: {
    grossTotal: unknown
    vatBaseTotal: unknown
    vatTotal: unknown
    netTotal: unknown
    withholdingTotal: unknown
    exchangeRate: unknown
}): EInvoiceWithMapped {
    return {
        ...e,
        grossTotal: Number(e.grossTotal),
        vatBaseTotal: Number(e.vatBaseTotal),
        vatTotal: Number(e.vatTotal),
        netTotal: Number(e.netTotal),
        withholdingTotal: Number(e.withholdingTotal),
        exchangeRate: e.exchangeRate ? Number(e.exchangeRate) : null,
    } as unknown as EInvoiceWithMapped
}

export function mapEInvoiceDetail(invoice: {
    grossTotal: unknown
    vatBaseTotal: unknown
    vatTotal: unknown
    netTotal: unknown
    withholdingTotal: unknown
    exchangeRate: unknown
    accountLines?: unknown
    order?: unknown
}): EInvoiceDetailWithMapped {
    return {
        ...mapEInvoice(invoice),
        accountLines: invoice.accountLines as Array<unknown> | undefined,
        order: invoice.order,
    } as EInvoiceDetailWithMapped
}
