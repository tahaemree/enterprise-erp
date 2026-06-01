import { describe, it, expect } from "vitest"
import { productSchema, categorySchema, supplierSchema } from "@/lib/validations/inventory"

describe("productSchema", () => {
    it("should validate a valid product", () => {
        const result = productSchema.safeParse({
            name: "Widget Pro",
            sku: "WGT-001",
            price: "29.99",
            quantity: "100",
            minStock: "10",
            unit: "pcs",
            isActive: true,
        })
        expect(result.success).toBe(true)
    })

    it("should reject name shorter than 2 characters", () => {
        const result = productSchema.safeParse({
            name: "A",
            sku: "WGT-001",
            price: "10",
            quantity: "5",
            minStock: "2",
            unit: "pcs",
            isActive: true,
        })
        expect(result.success).toBe(false)
    })

    it("should reject negative price", () => {
        const result = productSchema.safeParse({
            name: "Widget",
            sku: "WGT-001",
            price: "-10",
            quantity: "5",
            minStock: "2",
            unit: "pcs",
            isActive: true,
        })
        expect(result.success).toBe(false)
    })

    it("should reject non-numeric quantity", () => {
        const result = productSchema.safeParse({
            name: "Widget",
            sku: "WGT-001",
            price: "10",
            quantity: "abc",
            minStock: "2",
            unit: "pcs",
            isActive: true,
        })
        expect(result.success).toBe(false)
    })
})

describe("categorySchema", () => {
    it("should validate a valid category", () => {
        const result = categorySchema.safeParse({
            name: "Electronics",
            slug: "electronics",
            description: "Electronic items",
        })
        expect(result.success).toBe(true)
    })

    it("should reject invalid slug format", () => {
        const result = categorySchema.safeParse({
            name: "Invalid Slug",
            slug: "Has Spaces and UPPERCASE!",
        })
        expect(result.success).toBe(false)
    })

    it("should reject short name", () => {
        const result = categorySchema.safeParse({
            name: "A",
            slug: "a",
        })
        expect(result.success).toBe(false)
    })
})

describe("supplierSchema", () => {
    it("should validate a valid supplier", () => {
        const result = supplierSchema.safeParse({
            name: "Acme Corp",
            contactName: "John",
            email: "john@acme.com",
            phone: "+1234567890",
            isActive: true,
        })
        expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
        const result = supplierSchema.safeParse({
            name: "Acme Corp",
            email: "not-an-email",
            isActive: true,
        })
        expect(result.success).toBe(false)
    })

    it("should reject invalid website URL", () => {
        const result = supplierSchema.safeParse({
            name: "Acme Corp",
            website: "not-a-url",
            isActive: true,
        })
        expect(result.success).toBe(false)
    })

    it("should accept empty website and email", () => {
        const result = supplierSchema.safeParse({
            name: "Acme Corp",
            website: "",
            email: "",
            isActive: true,
        })
        expect(result.success).toBe(true)
    })
})
