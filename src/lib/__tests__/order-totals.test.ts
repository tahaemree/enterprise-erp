import { describe, expect, it } from "vitest"
import { calculateOrderTotals } from "@/lib/order-totals"

describe("calculateOrderTotals", () => {
    it("computes subtotal + KDV with no discount/shipping", () => {
        const r = calculateOrderTotals({
            items: [{ quantity: 2, unitPrice: 100 }],
            taxRate: 20,
            discountType: "fixed",
            discountValue: 0,
            shippingAmount: 0,
        })
        expect(r.subtotal).toBe(200)
        expect(r.discountAmount).toBe(0)
        expect(r.taxableBase).toBe(200)
        expect(r.taxAmount).toBe(40)
        expect(r.total).toBe(240)
    })

    it("applies a percentage discount before tax", () => {
        const r = calculateOrderTotals({
            items: [{ quantity: 1, unitPrice: 1000 }],
            taxRate: 20,
            discountType: "percentage",
            discountValue: 10,
            shippingAmount: 0,
        })
        expect(r.subtotal).toBe(1000)
        expect(r.discountAmount).toBe(100)
        expect(r.taxableBase).toBe(900)
        expect(r.taxAmount).toBe(180)
        expect(r.total).toBe(1080)
    })

    it("applies a fixed discount and adds shipping after tax", () => {
        const r = calculateOrderTotals({
            items: [{ quantity: 1, unitPrice: 500 }],
            taxRate: 10,
            discountType: "fixed",
            discountValue: 100,
            shippingAmount: 50,
        })
        expect(r.subtotal).toBe(500)
        expect(r.discountAmount).toBe(100)
        expect(r.taxableBase).toBe(400)
        expect(r.taxAmount).toBe(40)
        expect(r.total).toBe(490) // 400 + 40 + 50
    })

    it("clamps a fixed discount that exceeds the subtotal", () => {
        const r = calculateOrderTotals({
            items: [{ quantity: 1, unitPrice: 100 }],
            taxRate: 20,
            discountType: "fixed",
            discountValue: 500,
            shippingAmount: 0,
        })
        expect(r.discountAmount).toBe(100)
        expect(r.taxableBase).toBe(0)
        expect(r.taxAmount).toBe(0)
        expect(r.total).toBe(0)
    })

    it("handles multiple lines and rounds to 2 decimals (HALF_UP)", () => {
        const r = calculateOrderTotals({
            items: [
                { quantity: 3, unitPrice: 33.33 },
                { quantity: 1, unitPrice: 0.01 },
            ],
            taxRate: 18,
            discountType: "fixed",
            discountValue: 0,
            shippingAmount: 0,
        })
        expect(r.subtotal).toBe(100) // 99.99 + 0.01
        expect(r.taxAmount).toBe(18)
        expect(r.total).toBe(118)
    })

    it("treats a zero tax rate correctly", () => {
        const r = calculateOrderTotals({
            items: [{ quantity: 2, unitPrice: 50 }],
            taxRate: 0,
            discountType: "fixed",
            discountValue: 0,
            shippingAmount: 25,
        })
        expect(r.taxAmount).toBe(0)
        expect(r.total).toBe(125)
    })
})
