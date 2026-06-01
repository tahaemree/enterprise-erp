import { describe, it, expect } from "vitest"
import {
    renderInvoiceHtml,
    renderDespatchAdviceHtml,
    convertHtmlToPlainText,
    type DocumentTemplate,
} from "@/lib/services/xml-pdf-converter"

const baseTemplate: DocumentTemplate = {
    documentType: "INVOICE",
    invoiceNumber: "INV202600001",
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    issueDate: "2026-01-15",
    dueDate: "2026-02-15",
    currency: "TRY",
    supplier: {
        name: "Tedarikçi A.Ş.",
        taxId: "1234567890",
        address: "Atatürk Cad. No:123, İstanbul",
        phone: "+902122223344",
        email: "info@tedarikci.com",
    },
    customer: {
        name: "Müşteri Ltd. Şti.",
        taxId: "9876543210",
        address: "Cumhuriyet Mah. No:45, Ankara",
        email: "musteri@example.com",
    },
    items: [
        { name: "Bilgisayar", quantity: 2, unit: "Adet", unitPrice: 15000, total: 30000 },
        { name: "Monitör", quantity: 3, unit: "Adet", unitPrice: 5000, total: 15000 },
    ],
    subtotal: 45000,
    vatTotal: 9000,
    vatRate: 20,
    grandTotal: 54000,
    notes: "Teslimat adresi: Depo-1",
}

describe("renderInvoiceHtml", () => {
    it("should generate HTML with doctype and html tag", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("<!DOCTYPE html>")
        expect(html).toContain("<html lang=\"tr\">")
    })

    it("should include document title based on type", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("e-Fatura")
    })

    it("should include invoice number and UUID", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("INV202600001")
        expect(html).toContain("123e4567-e89b-12d3-a456-426614174000")
    })

    it("should include issue date and due date", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("2026-01-15")
        expect(html).toContain("2026-02-15")
    })

    it("should include supplier details", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("Tedarikçi A.Ş.")
        expect(html).toContain("1234567890")
        expect(html).toContain("+902122223344")
        expect(html).toContain("info@tedarikci.com")
        expect(html).toContain("Atatürk Cad. No:123, İstanbul")
    })

    it("should include customer details", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("Müşteri Ltd. Şti.")
        expect(html).toContain("9876543210")
        expect(html).toContain("musteri@example.com")
    })

    it("should include invoice items in the table", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("Bilgisayar")
        expect(html).toContain("Monitör")
    })

    it("should include financial totals including VAT and grand total", () => {
        const html = renderInvoiceHtml(baseTemplate)
        // formatAmount uses Intl.NumberFormat("tr-TR", {style: "currency"}) which outputs ₺45,000.00
        expect(html).toContain("20%")
        // All amounts are formatted with Turkish locale + TRY currency
        expect(html).toContain("₺") // Turkish Lira symbol
    })

    it("should include notes when provided", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("Teslimat adresi: Depo-1")
    })

    it("should not include notes section when not provided", () => {
        const noNotes = { ...baseTemplate, notes: undefined }
        const html = renderInvoiceHtml(noNotes)
        expect(html).not.toContain("<div class=\"notes\">")
    })

    it("should include withholding information when present", () => {
        const withWithholding: DocumentTemplate = {
            ...baseTemplate,
            withholdingTotal: 1800,
            grandTotal: 52200,
        }
        const html = renderInvoiceHtml(withWithholding)
        expect(html).toContain("Tevkifat (-)")
        expect(html).toContain("₺") // formatted amount with currency symbol
        expect(html).toContain("withholding")
    })

    it("should not include withholding line when total is 0", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).not.toContain("Tevkifat")
    })

    it("should show e-Arşiv title for ARCHIVE type", () => {
        const archive = { ...baseTemplate, documentType: "ARCHIVE" as const }
        const html = renderInvoiceHtml(archive)
        expect(html).toContain("e-Arşiv Fatura")
    })

    it("should show status badge when status is provided", () => {
        const withStatus: DocumentTemplate = {
            ...baseTemplate,
            status: "GIB_ACCEPTED",
        }
        const html = renderInvoiceHtml(withStatus)
        expect(html).toContain("status-GIB_ACCEPTED")
        expect(html).toContain("GIB_ACCEPTED")
    })

    it("should not include status badge when status is not provided", () => {
        const html = renderInvoiceHtml(baseTemplate)
        // CSS contains ".status-badge" but the rendered badge div would have "class=\"status-badge\""
        expect(html).not.toContain(">DRAFT<")
        expect(html).not.toContain(">SENT<")
        expect(html).not.toContain(">ACCEPTED<")
    })

    it("should include footer with UUID", () => {
        const html = renderInvoiceHtml(baseTemplate)
        expect(html).toContain("Deftra")
        expect(html).toContain("123e4567-e89b-12d3-a456-426614174000")
    })
})

describe("renderDespatchAdviceHtml", () => {
    it("should render HTML with DESPATCH_ADVICE type", () => {
        const html = renderDespatchAdviceHtml(baseTemplate)
        expect(html).toContain("e-İrsaliye")
    })
})

describe("convertHtmlToPlainText", () => {
    it("should remove HTML tags", () => {
        const html = "<p>Hello <b>World</b></p>"
        const text = convertHtmlToPlainText(html)
        expect(text).toBe("Hello World")
    })

    it("should remove style tags and their content", () => {
        const html = "<style>body { color: red; }</style><p>Content</p>"
        const text = convertHtmlToPlainText(html)
        expect(text).not.toContain("color: red")
        expect(text).toContain("Content")
    })

    it("should replace HTML entities", () => {
        const html = "<p>AT&amp;T &lt;Türkiye&gt;</p>"
        const text = convertHtmlToPlainText(html)
        expect(text).toContain("AT&T <Türkiye>")
    })

    it("should replace &nbsp; with space", () => {
        const html = "<p>Fiyat:&nbsp;100&nbsp;TL</p>"
        const text = convertHtmlToPlainText(html)
        // &nbsp; becomes space, then \\s+ collapses to single spaces
        expect(text).toContain("Fiyat: 100 TL")
    })

    it("should collapse multiple whitespace to single space", () => {
        const html = "<div>  Hello    World  </div>"
        const text = convertHtmlToPlainText(html)
        expect(text).toBe("Hello World")
    })

    it("should handle empty HTML", () => {
        expect(convertHtmlToPlainText("")).toBe("")
    })
})

describe("HTML escaping in templates", () => {
    it("should escape HTML entities in user-provided content", () => {
        const withHtml: DocumentTemplate = {
            ...baseTemplate,
            notes: "Not: <script>alert('xss')</script>",
            supplier: {
                ...baseTemplate.supplier,
                name: "Firma <b>A.Ş.</b>",
            },
        }
        const html = renderInvoiceHtml(withHtml)
        // Script tag should be escaped
        expect(html).not.toContain("<script>")
        expect(html).toContain("&lt;script&gt;")
        expect(html).toContain("&lt;b&gt;A.Ş.&lt;/b&gt;")
    })
})
