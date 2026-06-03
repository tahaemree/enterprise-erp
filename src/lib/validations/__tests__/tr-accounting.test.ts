import { describe, it, expect } from "vitest"
import {
    eInvoiceSchema,
    baBsFormSchema,
    inflationCoefficientSchema,
} from "@/lib/validations/tr-accounting"

// ==================== eInvoiceSchema ====================

describe("eInvoiceSchema", () => {
    it("should validate a valid e-invoice", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            profile: "TICARIFATURA",
            receiverTaxId: "1234567890",
            receiverName: "Müşteri A.Ş.",
            receiverEmail: "musteri@example.com",
            grossTotal: 45000,
            vatBaseTotal: 45000,
            vatTotal: 9000,
            netTotal: 54000,
            currency: "TRY",
            issueDate: new Date("2026-01-15"),
            dueDate: new Date("2026-02-15"),
            notes: "Teslimat adresi: Depo-1",
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.documentType).toBe("INVOICE")
            expect(result.data.grossTotal).toBe(45000)
        }
    })

    it("should validate e-Arşiv (ARCHIVE) type", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "ARCHIVE",
            receiverTaxId: "1234567890",
            receiverName: "Müşteri A.Ş.",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(true)
    })

    it("should validate e-İrsaliye (DESPATCH_ADVICE) type", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "DESPATCH_ADVICE",
            receiverTaxId: "1234567890",
            receiverName: "Müşteri A.Ş.",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(true)
    })

    it("should reject missing receiverTaxId", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverName: "Müşteri A.Ş.",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(false)
    })

    it("should reject missing receiverName", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(false)
    })

    it("should reject invalid documentType", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVALID",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(false)
    })

    it("should reject negative gross total", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            grossTotal: -100,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(false)
    })

    it("should apply default values for optional fields", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.currency).toBe("TRY")
            expect(result.data.withholdingTotal).toBe(0)
        }
    })

    it("should accept valid email or empty string", () => {
        const withEmail = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            receiverEmail: "test@example.com",
            grossTotal: 1000, vatBaseTotal: 1000, vatTotal: 200, netTotal: 1200,
            issueDate: new Date(),
        })
        expect(withEmail.success).toBe(true)

        const emptyEmail = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            receiverEmail: "",
            grossTotal: 1000, vatBaseTotal: 1000, vatTotal: 200, netTotal: 1200,
            issueDate: new Date(),
        })
        expect(emptyEmail.success).toBe(true)
    })

    it("should reject invalid email", () => {
        const result = eInvoiceSchema.safeParse({
            documentType: "INVOICE",
            receiverTaxId: "1234567890",
            receiverName: "Test",
            receiverEmail: "not-an-email",
            grossTotal: 1000, vatBaseTotal: 1000, vatTotal: 200, netTotal: 1200,
            issueDate: new Date(),
        })
        expect(result.success).toBe(false)
    })
})

// ==================== baBsFormSchema ====================

describe("baBsFormSchema", () => {
    it("should validate a valid BA form", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2026,
            month: 1,
            items: [
                { taxId: "1234567890", name: "Tedarikçi A.Ş.", documentCount: 5, totalAmount: 50000 },
                { taxId: "9876543210", name: "Tedarikçi B Ltd.", documentCount: 3, totalAmount: 25000 },
            ],
        })
        expect(result.success).toBe(true)
    })

    it("should validate a valid BS form", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BS",
            year: 2026,
            month: 2,
            items: [
                { taxId: "1111111111", name: "Müşteri A.Ş.", documentCount: 10, totalAmount: 100000 },
            ],
        })
        expect(result.success).toBe(true)
    })

    it("should reject invalid formType", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BC",
            year: 2026, month: 1,
            items: [{ taxId: "1", name: "Test", documentCount: 1, totalAmount: 100 }],
        })
        expect(result.success).toBe(false)
    })

    it("should reject year outside 2020-2100", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2019,
            month: 1,
            items: [{ taxId: "1", name: "Test", documentCount: 1, totalAmount: 100 }],
        })
        expect(result.success).toBe(false)
    })

    it("should reject month outside 1-12", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2026, month: 13,
            items: [{ taxId: "1", name: "Test", documentCount: 1, totalAmount: 100 }],
        })
        expect(result.success).toBe(false)
    })

    it("should reject empty items array", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2026, month: 1,
            items: [],
        })
        expect(result.success).toBe(false)
    })

    it("should reject negative total amount", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2026, month: 1,
            items: [{ taxId: "1", name: "Test", documentCount: 1, totalAmount: -100 }],
        })
        expect(result.success).toBe(false)
    })

    it("should reject document count less than 1", () => {
        const result = baBsFormSchema.safeParse({
            formType: "BA",
            year: 2026, month: 1,
            items: [{ taxId: "1", name: "Test", documentCount: 0, totalAmount: 100 }],
        })
        expect(result.success).toBe(false)
    })
})

// ==================== inflationCoefficientSchema ====================

describe("inflationCoefficientSchema", () => {
    it("should validate a valid inflation coefficient", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2026,
            month: 1,
            coefficient: 1.0234,
            ppi: 2500.45,
            source: "TÜİK",
            notes: "Ocak 2026 ÜFE endeksi",
        })
        expect(result.success).toBe(true)
    })

    it("should validate with only required fields", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2026,
            month: 1,
            coefficient: 1.05,
        })
        expect(result.success).toBe(true)
    })

    it("should reject non-positive coefficient", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2026, month: 1, coefficient: 0,
        })
        expect(result.success).toBe(false)
    })

    it("should reject negative coefficient", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2026, month: 1, coefficient: -1.5,
        })
        expect(result.success).toBe(false)
    })

    it("should reject year before 2020", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2019, month: 1, coefficient: 1.0,
        })
        expect(result.success).toBe(false)
    })

    it("should reject year after 2100", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2101, month: 1, coefficient: 1.0,
        })
        expect(result.success).toBe(false)
    })

    it("should reject invalid month", () => {
        const result = inflationCoefficientSchema.safeParse({
            year: 2026, month: 0, coefficient: 1.0,
        })
        expect(result.success).toBe(false)
    })
})
