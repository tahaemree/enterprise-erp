import { describe, it, expect } from "vitest"
import { customerSchema, interactionSchema } from "@/lib/validations/crm"

describe("customerSchema", () => {
    it("should validate a valid customer", () => {
        const result = customerSchema.safeParse({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phone: "+1234567890",
            source: "REFERRAL",
            status: "LEAD",
            tags: ["enterprise"],
        })
        expect(result.success).toBe(true)
    })

    it("should reject missing first name", () => {
        const result = customerSchema.safeParse({ lastName: "Doe" })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.some((i) => i.path.includes("firstName"))).toBe(true)
        }
    })

    it("should reject invalid email", () => {
        const result = customerSchema.safeParse({
            firstName: "John",
            lastName: "Doe",
            email: "not-an-email",
        })
        expect(result.success).toBe(false)
    })

    it("should accept empty email", () => {
        const result = customerSchema.safeParse({
            firstName: "John",
            lastName: "Doe",
            email: "",
        })
        expect(result.success).toBe(true)
    })

    it("should apply default values", () => {
        const result = customerSchema.safeParse({ firstName: "John", lastName: "Doe" })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.source).toBe("DIRECT")
            expect(result.data.status).toBe("LEAD")
            expect(result.data.tags).toEqual([])
        }
    })

    it("should reject invalid source enum", () => {
        const result = customerSchema.safeParse({
            firstName: "John",
            lastName: "Doe",
            source: "INVALID",
        })
        expect(result.success).toBe(false)
    })
})

describe("interactionSchema", () => {
    it("should validate a valid interaction", () => {
        const result = interactionSchema.safeParse({
            type: "CALL",
            subject: "Follow-up call",
            date: new Date(),
            customerId: "customer-1",
        })
        expect(result.success).toBe(true)
    })

    it("should reject missing required fields", () => {
        const result = interactionSchema.safeParse({ type: "EMAIL" })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
        }
    })
})
