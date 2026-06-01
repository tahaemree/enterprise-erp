import { describe, it, expect } from "vitest"
import { orderItemSchema, transactionSchema } from "../finance"

describe("Finance Validations", () => {
    describe("orderItemSchema", () => {
        it("should validate a valid order item with decimal quantities", () => {
            const validData = {
                productId: "prod_123",
                quantity: 1.5,
                unitPrice: 15.99,
            }
            
            const result = orderItemSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it("should fail if quantity is less than minimum allowed (0.001)", () => {
            const invalidData = {
                productId: "prod_123",
                quantity: 0.0005,
                unitPrice: 15.99,
            }
            
            const result = orderItemSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe("transactionSchema", () => {
        it("should validate a valid transaction", () => {
            const validData = {
                type: "INCOME",
                description: "Sale",
                amount: 1500.50,
                date: new Date().toISOString(),
            }
            
            const result = transactionSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it("should fail for invalid transaction type", () => {
            const invalidData = {
                type: "INVALID_TYPE",
                description: "Sale",
                amount: 1500.50,
                date: new Date().toISOString(),
            }
            
            const result = transactionSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })
})
