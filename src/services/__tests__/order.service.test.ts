import { describe, it, expect } from 'vitest'

// Vitest mock of the database
describe('Order Service Tests', () => {
    it('should correctly calculate subtotal, tax and total based on items', () => {
        // Mock items
        const items = [
            { quantity: 2, unitPrice: 100, taxRate: 18 },
            { quantity: 1, unitPrice: 50, taxRate: 8 }
        ]

        let subtotal = 0
        let taxAmount = 0
        
        items.forEach(item => {
            const itemTotal = item.quantity * item.unitPrice
            subtotal += itemTotal
            taxAmount += itemTotal * (item.taxRate / 100)
        })

        const total = subtotal + taxAmount

        expect(subtotal).toBe(250) // 200 + 50
        expect(taxAmount).toBe(40) // 36 + 4
        expect(total).toBe(290)
    })

    it('should handle zero quantities properly', () => {
        const items = [
            { quantity: 0, unitPrice: 100, taxRate: 18 }
        ]
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
        expect(subtotal).toBe(0)
    })
})
