/**
 * Order total calculation — single source of truth for both the server
 * (authoritative persistence) and the order form (live preview), so the two
 * can never disagree.
 *
 * Turkish ERP semantics:
 *   subtotal     = Σ(unitPrice × quantity)
 *   discountAmount = percentage → subtotal × value/100, fixed → value (clamped ≤ subtotal)
 *   taxableBase  = subtotal − discountAmount        (KDV matrahı)
 *   taxAmount    = taxableBase × taxRate/100         (KDV)
 *   total        = taxableBase + taxAmount + shipping
 *
 * NOTE: This module is intentionally dependency-free (no Prisma `Money`) so it
 * can run in the client bundle for the order form's live preview. Each step is
 * rounded HALF_UP to 2 decimals, which is exact for currency-magnitude values.
 */

/** Round to 2 decimals, HALF_UP. Inputs are non-negative currency amounts. */
function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface OrderTotalsItem {
    quantity: number
    unitPrice: number
}

export interface OrderTotalsInput {
    items: OrderTotalsItem[]
    /** Order-level KDV rate as a percentage, e.g. 20 for %20. */
    taxRate: number
    discountType: "fixed" | "percentage"
    discountValue: number
    shippingAmount: number
}

export interface OrderTotals {
    subtotal: number
    discountAmount: number
    taxableBase: number
    taxAmount: number
    shippingAmount: number
    total: number
}

export function calculateOrderTotals(input: OrderTotalsInput): OrderTotals {
    const taxRate = Number.isFinite(input.taxRate) ? Math.max(0, input.taxRate) : 0
    const discountValue = Number.isFinite(input.discountValue) ? Math.max(0, input.discountValue) : 0
    const shipping = round2(Number.isFinite(input.shippingAmount) ? Math.max(0, input.shippingAmount) : 0)

    const subtotal = round2(
        input.items.reduce((sum, item) => sum + round2(item.unitPrice * item.quantity), 0),
    )

    // Discount, clamped so it can never exceed the subtotal.
    let discountAmount =
        input.discountType === "percentage"
            ? round2((subtotal * discountValue) / 100)
            : round2(discountValue)
    if (discountAmount > subtotal) discountAmount = subtotal

    const taxableBase = round2(subtotal - discountAmount)
    const taxAmount = round2((taxableBase * taxRate) / 100)
    const total = round2(taxableBase + taxAmount + shipping)

    return {
        subtotal,
        discountAmount,
        taxableBase,
        taxAmount,
        shippingAmount: shipping,
        total,
    }
}
