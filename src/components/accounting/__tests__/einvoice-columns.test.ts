import { describe, it, expect } from "vitest"
import { createEInvoiceColumns, type EInvoice } from "../einvoice-columns"
import { createDespatchAdviceColumns, type DespatchAdvice } from "../despatch-advice-columns"

describe("createEInvoiceColumns", () => {
    it("should return an array of column definitions", () => {
        const tMock = (key: string) => key
        const columns = createEInvoiceColumns(tMock)
        expect(Array.isArray(columns)).toBe(true)
        expect(columns.length).toBeGreaterThan(0)
    })

    it("should include documentType column with header Type", () => {
        const tMock = (key: string) => key
        const columns = createEInvoiceColumns(tMock)
        const docTypeCol = columns.find((c) => "accessorKey" in c && c.accessorKey === "documentType")
        expect(docTypeCol).toBeDefined()
    })

    it("should include status column", () => {
        const tMock = (key: string) => key
        const columns = createEInvoiceColumns(tMock)
        const statusCol = columns.find((c) => "accessorKey" in c && c.accessorKey === "status")
        expect(statusCol).toBeDefined()
    })

    it("should include retry info column", () => {
        const tMock = (key: string) => key
        const columns = createEInvoiceColumns(tMock)
        const retryCol = columns.find((c) => "id" in c && c.id === "retryInfo")
        expect(retryCol).toBeDefined()
    })

    it("should include actions column", () => {
        const tMock = (key: string) => key
        const columns = createEInvoiceColumns(tMock)
        const actionsCol = columns.find((c) => "id" in c && c.id === "actions")
        expect(actionsCol).toBeDefined()
    })
})

describe("EInvoice type", () => {
    it("should accept valid EInvoice data", () => {
        const invoice: EInvoice = {
            id: "1",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            documentType: "INVOICE",
            profile: "TICARIFATURA",
            invoiceNumber: "INV202600001",
            status: "DRAFT",
            senderTaxId: "1234567890",
            senderName: "Tedarikçi A.Ş.",
            receiverTaxId: "9876543210",
            receiverName: "Müşteri Ltd.",
            receiverEmail: "musteri@example.com",
            grossTotal: 45000,
            vatBaseTotal: 45000,
            vatTotal: 9000,
            netTotal: 54000,
            withholdingTotal: 0,
            currency: "TRY",
            issueDate: new Date(),
            dueDate: new Date(),
            retryCount: 0,
            lastError: null,
            notes: "Test notu",
            createdAt: new Date(),
        }
        expect(invoice.id).toBe("1")
        expect(invoice.documentType).toBe("INVOICE")
        expect(invoice.status).toBe("DRAFT")
    })

    it("should accept DESPATCH_ADVICE type", () => {
        const invoice: EInvoice = {
            id: "2",
            uuid: "uuid-2",
            documentType: "DESPATCH_ADVICE",
            invoiceNumber: "IRS202600001",
            status: "GIB_ACCEPTED",
            senderTaxId: "1234567890",
            senderName: "Tedarikçi A.Ş.",
            receiverTaxId: "9876543210",
            receiverName: "Müşteri Ltd.",
            grossTotal: 10000,
            vatBaseTotal: 10000,
            vatTotal: 2000,
            netTotal: 12000,
            withholdingTotal: 0,
            currency: "TRY",
            issueDate: new Date(),
            retryCount: 1,
            lastError: "GIB-001: timeout",
            createdAt: new Date(),
        }
        expect(invoice.status).toBe("GIB_ACCEPTED")
        expect(invoice.retryCount).toBe(1)
    })

    it("should accept ARCHIVE type", () => {
        const invoice: EInvoice = {
            id: "3",
            uuid: "uuid-3",
            documentType: "ARCHIVE",
            status: "SENT_TO_GIB",
            senderTaxId: "1234567890",
            senderName: "Tedarikçi",
            receiverTaxId: "9876543210",
            receiverName: "Müşteri",
            grossTotal: 1000,
            vatBaseTotal: 1000,
            vatTotal: 200,
            netTotal: 1200,
            withholdingTotal: 0,
            currency: "TRY",
            issueDate: new Date(),
            retryCount: 0,
            createdAt: new Date(),
        }
        expect(invoice.documentType).toBe("ARCHIVE")
    })
})

describe("createDespatchAdviceColumns", () => {
    it("should return an array of column definitions", () => {
        const tMock = (key: string) => key
        const columns = createDespatchAdviceColumns(tMock)
        expect(Array.isArray(columns)).toBe(true)
        expect(columns.length).toBeGreaterThan(0)
    })

    it("should include invoiceNumber column", () => {
        const tMock = (key: string) => key
        const columns = createDespatchAdviceColumns(tMock)
        const numCol = columns.find((c) => "accessorKey" in c && c.accessorKey === "invoiceNumber")
        expect(numCol).toBeDefined()
    })

    it("should include actions column", () => {
        const tMock = (key: string) => key
        const columns = createDespatchAdviceColumns(tMock)
        const actionsCol = columns.find((c) => "id" in c && c.id === "actions")
        expect(actionsCol).toBeDefined()
    })
})

describe("DespatchAdvice type", () => {
    it("should accept valid DespatchAdvice data", () => {
        const advice: DespatchAdvice = {
            id: "1",
            uuid: "uuid-1",
            invoiceNumber: "IRS202600001",
            status: "DRAFT",
            senderName: "Gönderen A.Ş.",
            senderTaxId: "1234567890",
            receiverName: "Alıcı Ltd.",
            receiverTaxId: "9876543210",
            grossTotal: 25000,
            netTotal: 25000,
            currency: "TRY",
            issueDate: new Date(),
            createdAt: new Date(),
        }
        expect(advice.status).toBe("DRAFT")
        expect(advice.grossTotal).toBe(25000)
    })
})
