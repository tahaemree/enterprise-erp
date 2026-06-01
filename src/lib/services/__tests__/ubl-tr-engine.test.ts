import { describe, it, expect } from "vitest"
import {
    generateUblTrXml,
    generateEArsivXml,
    generateDespatchAdviceXml,
    generateGibUuid,
    PROFILE_OPTIONS,
    UNIT_CODE_OPTIONS,
    type UblDocumentInput,
} from "@/lib/services/ubl-tr-engine"

const baseInput: UblDocumentInput = {
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    documentType: "INVOICE",
    profile: "TICARIFATURA",
    invoiceNumber: "INV202600001",
    issueDate: new Date("2026-01-15"),
    issueTime: "14:30:00",
    dueDate: new Date("2026-02-15"),
    currency: "TRY",
    supplier: {
        taxId: "1234567890",
        taxIdScheme: "VKN",
        name: "Tedarikçi A.Ş.",
        street: "Atatürk Cad. No:123",
        city: "İstanbul",
        country: "Türkiye",
        phone: "+902122223344",
        email: "info@tedarikci.com",
    },
    customer: {
        taxId: "9876543210",
        taxIdScheme: "VKN",
        name: "Müşteri Ltd. Şti.",
        street: "Cumhuriyet Mah. No:45",
        city: "Ankara",
        country: "Türkiye",
        email: "musteri@example.com",
    },
    lines: [
        { id: 1, name: "Bilgisayar", quantity: 2, unitCode: "C62", unitPrice: 15000, lineExtensionAmount: 30000 },
        { id: 2, name: "Monitör", quantity: 3, unitCode: "C62", unitPrice: 5000, lineExtensionAmount: 15000 },
    ],
    grossTotal: 45000,
    vatBaseTotal: 45000,
    vatTotal: 9000,
    netTotal: 54000,
    notes: "Teslimat adresi: Depo-1",
    orderReference: "ORD-2026-001",
}

describe("generateUblTrXml", () => {
    it("should generate XML with correct header and encoding", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain(`<?xml version="1.0" encoding="UTF-8"?>`)
        expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"')
    })

    it("should include UBL version and customization IDs", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>")
        expect(xml).toContain("<cbc:CustomizationID>TR1.2</cbc:CustomizationID>")
    })

    it("should include profile, invoice number, and UUID", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:ProfileID>TICARIFATURA</cbc:ProfileID>")
        expect(xml).toContain("<cbc:ID>INV202600001</cbc:ID>")
        expect(xml).toContain("<cbc:UUID>123e4567-e89b-12d3-a456-426614174000</cbc:UUID>")
    })

    it("should include issue date, issue time, and due date", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:IssueDate>2026-01-15</cbc:IssueDate>")
        expect(xml).toContain("<cbc:IssueTime>14:30:00</cbc:IssueTime>")
        expect(xml).toContain("<cbc:DueDate>2026-02-15</cbc:DueDate>")
    })

    it("should include invoice type code SATIS for INVOICE", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>")
    })

    it("should include document currency code", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>")
    })

    it("should include line count numeric", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cbc:LineCountNumeric>2</cbc:LineCountNumeric>")
    })

    it("should include notes when provided", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("Teslimat adresi: Depo-1")
    })

    it("should include order reference when provided", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("ORD-2026-001")
    })

    it("should include supplier party details", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("Tedarikçi A.Ş.")
        expect(xml).toContain("1234567890")
        expect(xml).toContain("Atatürk Cad. No:123")
        expect(xml).toContain("İstanbul")
    })

    it("should include customer party details", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("Müşteri Ltd. Şti.")
        expect(xml).toContain("9876543210")
    })

    it("should include tax total section", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cac:TaxTotal>")
        expect(xml).toContain("<cbc:TaxAmount currencyID=\"TRY\">9000.00</cbc:TaxAmount>")
        expect(xml).toContain("<cbc:TaxableAmount currencyID=\"TRY\">45000.00</cbc:TaxableAmount>")
    })

    it("should include legal monetary total", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cac:LegalMonetaryTotal>")
        expect(xml).toContain("<cbc:PayableAmount currencyID=\"TRY\">54000.00</cbc:PayableAmount>")
    })

    it("should include invoice lines", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).toContain("<cac:InvoiceLine>")
        expect(xml).toContain("Bilgisayar")
        expect(xml).toContain("Monitör")
        expect(xml).toContain("<cbc:InvoicedQuantity unitCode=\"C62\">2</cbc:InvoicedQuantity>")
    })

    it("should include withholding note when withholding is present", () => {
        const withWithholding: UblDocumentInput = {
            ...baseInput,
            withholdingTotal: 1800,
            withholdingLines: [{ amount: 1800, ratio: "0.2", description: "KDV Tevkifatı" }],
        }
        const xml = generateUblTrXml(withWithholding)
        expect(xml).toContain("TEVKIFAT UYGULANMISTIR")
        expect(xml).toContain("<cac:WithholdingTaxTotal>")
        expect(xml).toContain("TEVKIFAT")
    })

    it("should not include withholding section when not present", () => {
        const xml = generateUblTrXml(baseInput)
        expect(xml).not.toContain("<cac:WithholdingTaxTotal>")
    })

    it("should not include notes when not provided", () => {
        const noNotes: UblDocumentInput = { ...baseInput, notes: undefined }
        const xml = generateUblTrXml(noNotes)
        expect(xml).not.toContain("<cbc:Note>")
    })

    it("should not include order reference when not provided", () => {
        const noRef: UblDocumentInput = { ...baseInput, orderReference: undefined }
        const xml = generateUblTrXml(noRef)
        expect(xml).not.toContain("<cac:OrderReference>")
    })

    it("should not include due date when not provided", () => {
        const noDueDate: UblDocumentInput = { ...baseInput, dueDate: undefined }
        const xml = generateUblTrXml(noDueDate)
        expect(xml).not.toContain("<cbc:DueDate>")
    })

    it("should include pricing currency code when exchange rate differs from 1", () => {
        const withExRate: UblDocumentInput = { ...baseInput, exchangeRate: 0.045 }
        const xml = generateUblTrXml(withExRate)
        expect(xml).toContain("<cbc:PricingCurrencyCode>TRY</cbc:PricingCurrencyCode>")
    })

    it("should not include pricing currency code when exchange rate is 1", () => {
        const withExRate: UblDocumentInput = { ...baseInput, exchangeRate: 1 }
        const xml = generateUblTrXml(withExRate)
        expect(xml).not.toContain("<cbc:PricingCurrencyCode>")
    })

    it("should not include pricing currency code when exchange rate is undefined", () => {
        const xml = generateUblTrXml(baseInput)
        // exchangeRate not set = undefined
        expect(xml).not.toContain("<cbc:PricingCurrencyCode>")
    })

    it("should not include supplier contact when phone and email are missing", () => {
        const noContact: UblDocumentInput = {
            ...baseInput,
            supplier: { ...baseInput.supplier, phone: undefined, email: undefined },
            customer: { ...baseInput.customer, email: undefined },
        }
        const xml = generateUblTrXml(noContact)
        expect(xml).not.toContain("<cac:Contact>")
    })
})

describe("generateEArsivXml", () => {
    it("should generate XML with ARCHIVE document type and EARSIVFATURA profile", () => {
        const input: UblDocumentInput = {
            ...baseInput,
            documentType: "ARCHIVE",
            profile: "EARSIVFATURA",
        }
        const xml = generateEArsivXml(input)
        expect(xml).toContain("<cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>")
        expect(xml).toContain("<cbc:InvoiceTypeCode>EARSIV</cbc:InvoiceTypeCode>")
    })

    it("should default profile to EARSIVFATURA when not provided", () => {
        const input = { ...baseInput, documentType: "ARCHIVE" as const, profile: undefined }
        const xml = generateEArsivXml(input)
        expect(xml).toContain("<cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>")
    })
})

describe("generateDespatchAdviceXml", () => {
    it("should generate XML with DespatchAdvice root element", () => {
        const input = { ...baseInput, profile: undefined }
        const xml = generateDespatchAdviceXml(input)
        expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"')
        expect(xml).toContain("<cbc:InvoiceTypeCode>SEVK</cbc:InvoiceTypeCode>")
        expect(xml).toContain("<cbc:ProfileID>TEMELFATURA</cbc:ProfileID>")
    })

    it("should use DespatchLine instead of InvoiceLine", () => {
        const xml = generateDespatchAdviceXml(baseInput)
        expect(xml).not.toContain("<cac:InvoiceLine>")
        // Should contain DespatchLine with DeliveredQuantity
        expect(xml).toContain("<cac:DespatchLine>")
        expect(xml).toContain("<cbc:DeliveredQuantity")
    })

    it("should default profile to TEMELFATURA", () => {
        const input = { ...baseInput, profile: undefined }
        const xml = generateDespatchAdviceXml(input)
        expect(xml).toContain("<cbc:ProfileID>TEMELFATURA</cbc:ProfileID>")
    })
})

describe("XML escaping", () => {
    it("should escape special XML characters in text fields", () => {
        const input: UblDocumentInput = {
            ...baseInput,
            notes: "Fatura <iptal> & 'düzeltildi'",
            customer: {
                ...baseInput.customer,
                name: "Müşteri & Tedarikçi Ltd. <Şti.>",
            },
            supplier: {
                ...baseInput.supplier,
                name: "Firma \"A.Ş.\"",
            },
        }
        const xml = generateUblTrXml(input)
        expect(xml).toContain("Fatura &lt;iptal&gt; &amp; &apos;düzeltildi&apos;")
        expect(xml).toContain("Müşteri &amp; Tedarikçi Ltd. &lt;Şti.&gt;")
        expect(xml).toContain("Firma &quot;A.Ş.&quot;")
    })
})

describe("generateGibUuid", () => {
    it("should generate a UUID in standard format", () => {
        const uuid = generateGibUuid()
        // UUID format: 8-4-4-4-12 hex chars
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    it("should generate unique UUIDs on subsequent calls", () => {
        const uuids = new Set<string>()
        for (let i = 0; i < 100; i++) {
            uuids.add(generateGibUuid())
        }
        expect(uuids.size).toBe(100)
    })

    it("should only use lowercase hex characters", () => {
        const uuid = generateGibUuid()
        expect(uuid).toBe(uuid.toLowerCase())
        expect(uuid).not.toMatch(/[g-z]/)
    })
})

describe("PROFILE_OPTIONS", () => {
    it("should include 4 profile options", () => {
        expect(PROFILE_OPTIONS).toHaveLength(4)
        const values = PROFILE_OPTIONS.map((p) => p.value)
        expect(values).toContain("TEMELFATURA")
        expect(values).toContain("TICARIFATURA")
        expect(values).toContain("EARSIVFATURA")
        expect(values).toContain("IHRACAT")
    })

    it("should contain expected options", () => {
        expect(PROFILE_OPTIONS[0]!.value).toBe("TEMELFATURA")
        expect(PROFILE_OPTIONS[3]!.value).toBe("IHRACAT")
    })
})

describe("UNIT_CODE_OPTIONS", () => {
    it("should include C62 (Adet) and other common units", () => {
        const values = UNIT_CODE_OPTIONS.map((u) => u.value)
        expect(values).toContain("C62")
        expect(values).toContain("KGM")
        expect(values).toContain("LTR")
        expect(values).toContain("MTR")
    })

    it("should contain expected options", () => {
        expect(UNIT_CODE_OPTIONS[0]!.value).toBe("C62")
        expect(UNIT_CODE_OPTIONS[9]!.value).toBe("MON")
    })
})
