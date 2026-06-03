import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Test Data ──────────────────────────────────────────────────────────

const mockUser = {
    id: "user-1",
    email: "admin@test.com",
    name: "Admin",
    role: "MANAGER" as const,
    tenantId: "tenant-1",
    tenantName: "Test Corp",
}

const mockEInvoice = {
    id: "einv-1",
    uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    documentType: "INVOICE",
    profile: "TICARIFATURA",
    invoiceNumber: "EINV202600001",
    status: "DRAFT",
    senderTaxId: "1234567890",
    senderName: "Test Corp",
    receiverTaxId: "1234567890",
    receiverName: "Müşteri A.Ş.",
    receiverEmail: "musteri@test.com",
    grossTotal: 1000.00,
    vatBaseTotal: 1000.00,
    vatTotal: 200.00,
    netTotal: 1200.00,
    withholdingTotal: 0,
    currency: "TRY",
    exchangeRate: null,
    issueDate: new Date("2026-06-01"),
    dueDate: new Date("2026-07-01"),
    xmlContent: "<xml>test</xml>",
    notes: "Test invoice",
    hash: null,
    lastError: null,
    retryCount: 0,
    lastAttemptAt: null,
    documentNumber: null,
    orderId: null,
    tenantId: "tenant-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
}

const validEInvoiceInput = {
    documentType: "INVOICE" as const,
    receiverTaxId: "1234567890",
    receiverName: "Müşteri A.Ş.",
    receiverEmail: "musteri@test.com",
    grossTotal: 1000.00,
    vatBaseTotal: 1000.00,
    vatTotal: 200.00,
    netTotal: 1200.00,
    withholdingTotal: 0,
    currency: "TRY",
    issueDate: new Date("2026-06-01"),
    dueDate: new Date("2026-07-01"),
    notes: "Test invoice",
}

const mockUserWithTenant = {
    ...mockUser,
    tenant: { name: "Test Corp" },
}

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
    eInvoice: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
    customerAccount: { findMany: vi.fn() },
    supplierAccount: { findMany: vi.fn() },
    inflationCoefficient: { findFirst: vi.fn(), update: vi.fn() },
    baBsForm: { create: vi.fn() },
    currency: { findUnique: vi.fn(), findMany: vi.fn() },
    currencyExchangeRate: { findFirst: vi.fn(), findMany: vi.fn() },
    taxType: { create: vi.fn(), findMany: vi.fn() },
    accountEntry: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
}

const mockRequireAuth = vi.fn(() => Promise.resolve(mockUser))
const mockRequireManager = vi.fn()

vi.mock("@/lib/prisma", () => ({
    getTenantPrisma: vi.fn(() => mockDb),
    basePrisma: {},
    isUniqueConstraintError: vi.fn(() => false),
}))

vi.mock("@/lib/auth-utils", () => ({
    requireAuth: mockRequireAuth,
    requireManager: mockRequireManager,
}))

vi.mock("@/services/activity-log.service", () => ({
    activityLogService: { log: vi.fn() },
}))

vi.mock("@/lib/logger", () => ({
    default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

// Mock external services to avoid heavy imports
vi.mock("@/lib/services/tax-engine", () => ({
    calculateTax: vi.fn((input: { netAmount: number; kdvRate: number }) => ({
        netAmount: input.netAmount,
        kdvAmount: input.netAmount * (input.kdvRate / 100),
        grossAmount: input.netAmount * (1 + input.kdvRate / 100),
    })),
    calculateBatchTax: vi.fn(() => ({ items: [], total: 0 })),
}))

vi.mock("@/lib/services/tax-engine-types", () => ({
    KDV_RATE_OPTIONS: [{ value: "0.18", label: "KDV 18%" }],
    TEVKIFAT_OPTIONS: [],
    STOPAJ_OPTIONS: [],
}))

vi.mock("@/lib/services/ubl-tr-engine", () => ({
    generateUblTrXml: vi.fn(() => "<xml>generated</xml>"),
    generateDespatchAdviceXml: vi.fn(() => "<xml>despatch</xml>"),
    generateGibUuid: vi.fn(() => "mocked-uuid-12345"),
}))

vi.mock("@/lib/services/xml-pdf-converter", () => ({
    renderInvoiceHtml: vi.fn(() => "<html>preview</html>"),
    convertHtmlToPlainText: vi.fn(() => "plain text"),
}))

vi.mock("@/lib/services/retry-engine", () => ({
    submitWithRetry: vi.fn(),
    classifyErrorFromMessage: vi.fn(),
    determineInvoiceStatus: vi.fn(),
}))

vi.mock("@/lib/services/gib-soap-adapter", () => ({
    GibSoapAdapter: function GibSoapAdapter() {
        return {
            sendInvoice: vi.fn(),
            checkUser: vi.fn(() => Promise.resolve({ success: true, data: { isRegistered: true, title: "Test Corp" }, error: null })),
            getInvoiceStatus: vi.fn(),
        }
    },
    getGibEndpoint: vi.fn(() => "https://test.gib.gov.tr"),
}))

vi.mock("@/lib/services/gib-signature", () => ({
    GibXmlSigner: vi.fn(),
    computeDocumentHash: vi.fn(() => Promise.resolve("mocked-hash")),
}))

vi.mock("@/lib/services/ba-bs-engine", () => ({
    generateBaForm: vi.fn(),
    generateBsForm: vi.fn(),
    generateBaBsXml: vi.fn(() => "<xml>babs</xml>"),
}))

vi.mock("@/lib/services/inflation-engine", () => ({
    calculateRevaluation: vi.fn(() => ({
        items: [],
        summary: { totalDifference: 0 },
    })),
}))

// ─── Tests ──────────────────────────────────────────────────────────────

describe("e-Invoice — Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── getEInvoices ────────────────────────────────────────────────────

    describe("getEInvoices", () => {
        it("should return all e-invoices without pagination", async () => {
            mockDb.eInvoice.findMany.mockResolvedValue([mockEInvoice])

            const { getEInvoices } = await import("./e-invoice")
            const result = await getEInvoices()

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: "einv-1",
                invoiceNumber: "EINV202600001",
            })
        })

        it("should return paginated results", async () => {
            mockDb.eInvoice.findMany.mockResolvedValue([mockEInvoice])
            mockDb.eInvoice.count.mockResolvedValue(1)

            const { getEInvoices } = await import("./e-invoice")
            const result = await getEInvoices({ page: 1, pageSize: 10 })

            expect(result).toHaveProperty("data")
            expect(result).toHaveProperty("total", 1)
            expect(result).toHaveProperty("page", 1)
            expect((result as { data: unknown[] }).data).toHaveLength(1)
        })
    })

    // ── getEInvoiceById ────────────────────────────────────────────────

    describe("getEInvoiceById", () => {
        it("should return a single e-invoice with details", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue({
                ...mockEInvoice,
                accountLines: [],
                order: null,
            })

            const { getEInvoiceById } = await import("./e-invoice")
            const result = await getEInvoiceById("einv-1")

            expect(result).not.toBeNull()
            expect(result).toMatchObject({
                id: "einv-1",
                invoiceNumber: "EINV202600001",
            })
            expect(mockDb.eInvoice.findFirst).toHaveBeenCalledWith({
                where: { id: "einv-1", tenantId: "tenant-1" },
                include: expect.objectContaining({
                    accountLines: expect.any(Object),
                    order: true,
                }),
            })
        })

        it("should return null for non-existent e-invoice", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue(null)

            const { getEInvoiceById } = await import("./e-invoice")
            const result = await getEInvoiceById("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── createEInvoice ──────────────────────────────────────────────────

    describe("createEInvoice", () => {
        it("should create an e-invoice with UBL XML", async () => {
            mockDb.user.findUnique.mockResolvedValue(mockUserWithTenant)
            mockDb.eInvoice.create.mockResolvedValue(mockEInvoice)

            const { createEInvoice } = await import("./e-invoice")
            const result = await createEInvoice(validEInvoiceInput)

            expect(result).toMatchObject({
                id: "einv-1",
                invoiceNumber: "EINV202600001",
            })
            expect(mockDb.eInvoice.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        receiverTaxId: "1234567890",
                        tenantId: "tenant-1",
                        xmlContent: expect.any(String),
                    }),
                })
            )
        })

        it("should reject non-MANAGER role", async () => {
            const { AuthorizationError } = await import("@/lib/errors")
            mockRequireManager.mockImplementationOnce(() => {
                throw new AuthorizationError("Insufficient permissions")
            })

            const { createEInvoice } = await import("./e-invoice")
            const result = await createEInvoice(validEInvoiceInput)
                .catch((err: Error) => err)

            expect(result).toBeInstanceOf(AuthorizationError)
            expect(mockDb.eInvoice.create).not.toHaveBeenCalled()
        })

        it("should reject invalid input data", async () => {
            const { createEInvoice } = await import("./e-invoice")
            const result = createEInvoice({
                documentType: "INVOICE",
                receiverTaxId: "",
                receiverName: "",
                grossTotal: 0,
                vatBaseTotal: 0,
                vatTotal: 0,
                netTotal: 0,
                withholdingTotal: 0,
                currency: "TRY",
                issueDate: new Date(),
            })

            await expect(result).rejects.toThrow()
            expect(mockDb.eInvoice.create).not.toHaveBeenCalled()
        })
    })

    // ── cancelEInvoice ─────────────────────────────────────────────────

    describe("cancelEInvoice", () => {
        it("should cancel a draft e-invoice", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue(mockEInvoice)
            mockDb.eInvoice.update.mockResolvedValue({
                ...mockEInvoice,
                status: "CANCELLED",
            })

            const { cancelEInvoice } = await import("./e-invoice")
            const result = await cancelEInvoice("einv-1")

            expect(result).toMatchObject({
                id: "einv-1",
                status: "CANCELLED",
            })
            expect(mockDb.eInvoice.update).toHaveBeenCalledWith({
                where: { id: "einv-1" },
                data: { status: "CANCELLED" },
            })
        })

        it("should reject cancelling a GIB_ACCEPTED invoice", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue({
                ...mockEInvoice,
                status: "GIB_ACCEPTED",
            })

            const { cancelEInvoice } = await import("./e-invoice")
            await expect(cancelEInvoice("einv-1")).rejects.toThrow(/credit note/)
        })

        it("should return not-found for non-existent invoice", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue(null)

            const { cancelEInvoice } = await import("./e-invoice")
            await expect(cancelEInvoice("nonexistent")).rejects.toThrow(/not found/i)
        })
    })

    // ── getEInvoiceXml ─────────────────────────────────────────────────

    describe("getEInvoiceXml", () => {
        it("should return XML content for an e-invoice", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue({
                xmlContent: "<xml>test</xml>",
            })

            const { getEInvoiceXml } = await import("./e-invoice")
            const result = await getEInvoiceXml("einv-1")

            expect(result).toBe("<xml>test</xml>")
            expect(mockDb.eInvoice.findFirst).toHaveBeenCalledWith({
                where: { id: "einv-1", tenantId: "tenant-1" },
                select: { xmlContent: true },
            })
        })

        it("should return null when invoice has no XML", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue({
                xmlContent: null,
            })

            const { getEInvoiceXml } = await import("./e-invoice")
            const result = await getEInvoiceXml("einv-1")

            expect(result).toBeNull()
        })

        it("should return null when invoice does not exist", async () => {
            mockDb.eInvoice.findFirst.mockResolvedValue(null)

            const { getEInvoiceXml } = await import("./e-invoice")
            const result = await getEInvoiceXml("nonexistent")

            expect(result).toBeNull()
        })
    })

    // ── calculateTaxAction ────────────────────────────────────────────

    describe("calculateTaxAction", () => {
        it("should calculate KDV for a given net amount", async () => {
            const { calculateTaxAction } = await import("./e-invoice")
            const result = await calculateTaxAction({
                netAmount: 1000,
                kdvRate: 18,
            })

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data).toMatchObject({
                    netAmount: 1000,
                    kdvAmount: 180,
                    grossAmount: 1180,
                })
            }
        })

        it("should handle zero net amount", async () => {
            const { calculateTaxAction } = await import("./e-invoice")
            const result = await calculateTaxAction({
                netAmount: 0,
                kdvRate: 18,
            })

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.data.kdvAmount).toBe(0)
            }
        })
    })

    // ── getKdvRateOptions ─────────────────────────────────────────────

    describe("getKdvRateOptions", () => {
        it("should return KDV rate options", async () => {
            const { getKdvRateOptions } = await import("./e-invoice")
            const result = await getKdvRateOptions()

            expect(Array.isArray(result)).toBe(true)
            expect(result[0]).toHaveProperty("value")
            expect(result[0]).toHaveProperty("label")
        })
    })

    // ── checkEInvoiceUser (GİB) ───────────────────────────────────────

    describe("checkEInvoiceUser", () => {
        it("should check if a tax ID is an e-invoice user", async () => {
            const { checkEInvoiceUser } = await import("./e-invoice")
            const result = await checkEInvoiceUser("1234567890")

            expect(result).toHaveProperty("success")
            expect(result).toHaveProperty("isRegistered")
        })
    })
})
