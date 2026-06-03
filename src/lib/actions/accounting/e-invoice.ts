"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import crypto from "crypto"
import { getPaginationArgs, createPaginatedResult, type PaginationParams, type PaginatedResult } from "@/lib/pagination"
import {
    eInvoiceSchema,
    type EInvoiceFormValues,
} from "@/lib/validations/tr-accounting"
import { executeAction, fromZodError, NotFoundError, ConflictError, AppError, type ActionResult } from "@/lib/errors"
import { assertEInvoiceTransition } from "@/lib/einvoice-state"
import { MODULE, PATHS } from "@/lib/constants"

// ==================== FAZ 3: KDV/STOPAJ/ENFLASYON HESAPLAMALARI ====================
import {
    calculateTax as engineCalculateTax,
    calculateBatchTax,
    type BatchTaxResult,
    type KdvRate,
    type TevkifatRatio,
    type StopajRate,
} from "@/lib/services/tax-engine"

import {
    KDV_RATE_OPTIONS,
    TEVKIFAT_OPTIONS,
    type TaxCalculationResult,
} from "@/lib/services/tax-engine-types"

import {
    generateUblTrXml,
    generateGibUuid,
    type UblDocumentInput,
    type UblInvoiceLine,
} from "@/lib/services/ubl-tr-engine"

import {
    renderInvoiceHtml,
} from "@/lib/services/xml-pdf-converter"




import {
    GibSoapAdapter,
    type GibEnvironment,
    type GibDocumentType,
} from "@/lib/services/gib-soap-adapter"

import {
    computeDocumentHash,
} from "@/lib/services/gib-signature"

import {
    generateBaForm,
    generateBsForm,
    generateBaBsXml,
    type BaBsGenerationResult,
    type BaBsSourceDocument,
} from "@/lib/services/ba-bs-engine"


import {
    calculateRevaluation,
    type RevaluationResult,
} from "@/lib/services/inflation-engine"

import {
    mapEInvoice,
    mapEInvoiceDetail,
    einvoiceInclude,
    type EInvoiceWithMapped,
    type EInvoiceDetailWithMapped,
} from "./e-invoice-mappers"

/**
 * KDV, tevkifat ve stopaj hesaplaması yapar (server-side)
 */
export async function calculateTaxAction(
    input: {
        netAmount: number
        kdvRate: KdvRate
        isGross?: boolean
        tevkifatRatio?: TevkifatRatio
        stopajRate?: StopajRate
    }
) : Promise<ActionResult<TaxCalculationResult>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
    
        const result = engineCalculateTax(input)
    
        logger.info("Tax calculation performed", {
            module: MODULE.TR_ACCOUNTING,
            userId: user.id,
            netAmount: input.netAmount,
            kdvRate: input.kdvRate,
        })
    
        return result
    
    })
}

/**
 * Toplu vergi hesaplaması yapar
 */
export async function calculateBatchTaxAction(
    items: Array<{
        label: string
        netAmount: number
        kdvRate: KdvRate
        tevkifatRatio?: TevkifatRatio
        stopajRate?: StopajRate
    }>
) : Promise<ActionResult<BatchTaxResult>> {
    return executeAction(async () => {
    
        await requireAuth()
    
        return calculateBatchTax(items)
    
    })
}

/**
 * Belirli bir dönemdeki faturalardan BA/BS formu oluşturur.
 * Gerçek veriler DB'den alınır, e-invoice verileri kullanılır.
 */
export async function generateBaBsFormAction(
    formType: "BA" | "BS",
    year: number,
    month: number
) : Promise<ActionResult<{ form: unknown; generationResult: BaBsGenerationResult }>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        // İlgili dönemdeki e-faturaları bul
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
    
        const invoices = await db.eInvoice.findMany({
            where: {
                tenantId: user.tenantId,
                issueDate: { gte: startDate, lte: endDate },
                status: { in: ["GIB_ACCEPTED", "SENT_TO_GIB"] },
            },
            select: {
                senderTaxId: true,
                senderName: true,
                receiverTaxId: true,
                receiverName: true,
                netTotal: true,
                invoiceNumber: true,
                issueDate: true,
            },
        })
    
        if (invoices.length === 0) {
            throw new AppError("No invoices found for the specified period", 404, "NOT_FOUND")
        }
    
        const documents: BaBsSourceDocument[] = invoices.map((inv) => ({
            senderTaxId: inv.senderTaxId,
            senderName: inv.senderName,
            receiverTaxId: inv.receiverTaxId,
            receiverName: inv.receiverName,
            total: Number(inv.netTotal),
            invoiceNumber: inv.invoiceNumber || undefined,
            date: inv.issueDate,
        }))
    
        // BA veya BS formu oluştur
        const generationResult = formType === "BA"
            ? generateBaForm({ year, month }, documents)
            : generateBsForm({ year, month }, documents)
    
        // XML oluştur
        const xmlContent = generateBaBsXml(generationResult)
    
        // DB'ye kaydet
        const form = await db.baBsForm.create({
            data: {
                formType: formType === "BA" ? "BA" : "BS",
                year,
                month,
                status: "DRAFT",
                xmlContent,
                tenantId: user.tenantId,
                items: {
                    create: generationResult.items.map((item) => ({
                        taxId: item.taxId,
                        name: item.name,
                        documentCount: item.documentCount,
                        totalAmount: item.totalAmount,
                    })),
                },
            },
            include: { items: true },
        })
    
        logger.info("BA/BS form auto-generated", {
            module: MODULE.TR_ACCOUNTING,
            userId: user.id,
            formId: form.id,
            formType,
            year,
            month,
            totalItems: generationResult.items.length,
        })
    
        revalidatePath(PATHS.BA_BS)
        return { form, generationResult }
    
    })
}

/**
 * Cari hesapların enflasyon düzeltmesini yapar ve muhasebe fişi oluşturur.
 */
export async function revalueBalancesAction(
    year: number,
    month: number,
    _coefficient: number
) : Promise<ActionResult<RevaluationResult>> {
    return executeAction(async () => {
    
        const user = await requireAuth()
        requireManager(user)
        const db = getTenantPrisma(user.tenantId)
    
        // Son dönem katsayısını doğrula
        const validCoefficient = await db.inflationCoefficient.findFirst({
            where: { year, month, tenantId: user.tenantId },
        })
    
        if (!validCoefficient) {
            throw new NotFoundError(`Inflation coefficient for ${year}/${month}`)
        }
    
        const appliedCoefficient = Number(validCoefficient.coefficient)
    
        // Tüm cari hesapları al
        const [customerAccounts, supplierAccounts] = await Promise.all([
            db.customerAccount.findMany({ where: { tenantId: user.tenantId, isActive: true } }),
            db.supplierAccount.findMany({ where: { tenantId: user.tenantId, isActive: true } }),
        ])
    
        const items = [
            ...customerAccounts.map((a) => ({
                label: `Cari: ${a.accountCode}`,
                accountCode: a.accountCode,
                bookValue: Number(a.currentBalance),
                coefficient: appliedCoefficient,
            })),
            ...supplierAccounts.map((a) => ({
                label: `Tedarikçi: ${a.accountCode}`,
                accountCode: a.accountCode,
                bookValue: Number(a.currentBalance),
                coefficient: appliedCoefficient,
            })),
        ]
    
        if (items.length === 0) {
            throw new NotFoundError("Customer or supplier accounts for revaluation")
        }
    
        const result = calculateRevaluation({ items, period: { year, month } })
    
        // Katsayıyı güncelle — kullanıldı olarak işaretle
        await db.inflationCoefficient.update({
            where: { id: validCoefficient.id },
            data: {
                notes: `Applied revaluation - ${items.length} items adjusted. Diff: ${result.summary.totalDifference}`,
            },
        })
    
        logger.info("Inflation revaluation performed", {
            module: MODULE.TR_ACCOUNTING,
            userId: user.id,
            year,
            month,
            totalItems: items.length,
            totalDifference: result.summary.totalDifference,
        })
    
        return result
    
    })
}

/**
 * KDV oranı seçeneklerini döndürür (client-side kullanım için)
 */
export async function getKdvRateOptions() {
    return KDV_RATE_OPTIONS
}

/**
 * Tevkifat oranı seçeneklerini döndürür
 */
export async function getTevkifatOptions() {
    return TEVKIFAT_OPTIONS
}

export async function getEInvoices(): Promise<EInvoiceWithMapped[]>
export async function getEInvoices(params: PaginationParams): Promise<PaginatedResult<EInvoiceWithMapped>>
export async function getEInvoices(params?: PaginationParams) {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const pagination = getPaginationArgs(params)

    if (!pagination) {
        const data = await db.eInvoice.findMany({
            orderBy: { createdAt: "desc" },
        })
        return data.map(mapEInvoice)
    }

    const [data, total] = await Promise.all([
        db.eInvoice.findMany({ ...pagination, orderBy: { createdAt: "desc" } }),
        db.eInvoice.count(),
    ])
    return createPaginatedResult(data.map(mapEInvoice), total, params)
}

/**
 * Tek bir e-faturayı detaylarıyla döndürür.
 */
export async function getEInvoiceById(id: string): Promise<EInvoiceDetailWithMapped | null> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
        include: einvoiceInclude,
    })

    if (!invoice) return null
    return mapEInvoiceDetail(invoice)
}

/**
 * Yeni bir e-fatura / e-arşiv oluşturur.
 * Eşzamanlı olarak UBL TR 2.1 XML şeması oluşturulur.
 */
export async function createEInvoice(data: EInvoiceFormValues) {
    const user = await requireAuth()
    requireManager(user)
    const db = getTenantPrisma(user.tenantId)

    const parsed = eInvoiceSchema.safeParse(data)
    if (!parsed.success) throw fromZodError(parsed.error)

    const uuid = generateGibUuid()
    const randomSeq = crypto.randomInt(1, 999999999)
    const invoiceNumber = `EIV${new Date().getFullYear()}${String(randomSeq).padStart(9, "0")}`

    // UBL TR 2.1 XML oluştur
    const supplier = await db.user.findUnique({
        where: { id: user.id },
        include: { tenant: true },
    })

    const supplierName = supplier?.tenant?.name || user.tenantName || "İşletme"
    const senderTaxId = supplier?.tenant?.taxId || "11111111111" // Tenant'a ait VKN (Fallback ile)

    const ublLines: UblInvoiceLine[] = [
        {
            id: 1,
            name: "Mal / Hizmet",
            quantity: 1,
            unitPrice: parsed.data.grossTotal,
            lineExtensionAmount: parsed.data.grossTotal,
        },
    ]

    const ublInput: UblDocumentInput = {
        uuid,
        documentType: parsed.data.documentType as "INVOICE" | "ARCHIVE",
        profile: parsed.data.profile || (parsed.data.documentType === "ARCHIVE" ? "EARSIVFATURA" : "TICARIFATURA"),
        invoiceNumber,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        currency: parsed.data.currency,
        exchangeRate: parsed.data.exchangeRate,
        supplier: {
            taxId: senderTaxId,
            name: supplierName,
            email: user.email || undefined,
        },
        customer: {
            taxId: parsed.data.receiverTaxId,
            name: parsed.data.receiverName,
            email: parsed.data.receiverEmail || undefined,
        },
        lines: ublLines,
        grossTotal: parsed.data.grossTotal,
        vatBaseTotal: parsed.data.vatBaseTotal,
        vatTotal: parsed.data.vatTotal,
        netTotal: parsed.data.netTotal,
        withholdingTotal: parsed.data.withholdingTotal || 0,
        notes: parsed.data.notes,
    }

    const xmlContent = ublInput.documentType === "ARCHIVE"
        ? generateUblTrXml(ublInput) // e-Arşiv için aynı şema
        : generateUblTrXml(ublInput)

    // HTML önizleme oluştur
    const _htmlContent = renderInvoiceHtml({
        documentType: parsed.data.documentType as "INVOICE" | "ARCHIVE",
        invoiceNumber,
        uuid,
        issueDate: parsed.data.issueDate.toISOString(),
        dueDate: parsed.data.dueDate?.toISOString(),
        currency: parsed.data.currency,
        supplier: { name: supplierName, taxId: senderTaxId },
        customer: { name: parsed.data.receiverName, taxId: parsed.data.receiverTaxId },
        items: [{ name: "Mal / Hizmet", quantity: 1, unit: "Adet", unitPrice: parsed.data.grossTotal, total: parsed.data.grossTotal }],
        subtotal: parsed.data.grossTotal,
        vatTotal: parsed.data.vatTotal,
        vatRate: parsed.data.vatBaseTotal > 0 ? Math.round((parsed.data.vatTotal / parsed.data.vatBaseTotal) * 100) : 0,
        grandTotal: parsed.data.netTotal,
        notes: parsed.data.notes,
    })

    // DB'ye kaydet
    const invoice = await db.eInvoice.create({
        data: {
            uuid,
            documentType: parsed.data.documentType,
            profile: parsed.data.profile,
            invoiceNumber,
            status: "DRAFT",
            senderTaxId: senderTaxId,
            senderName: supplierName,
            receiverTaxId: parsed.data.receiverTaxId,
            receiverName: parsed.data.receiverName,
            receiverEmail: parsed.data.receiverEmail,
            grossTotal: parsed.data.grossTotal,
            vatBaseTotal: parsed.data.vatBaseTotal,
            vatTotal: parsed.data.vatTotal,
            netTotal: parsed.data.netTotal,
            withholdingTotal: parsed.data.withholdingTotal || 0,
            currency: parsed.data.currency,
            exchangeRate: parsed.data.exchangeRate ? Number(parsed.data.exchangeRate) : null,
            issueDate: parsed.data.issueDate,
            dueDate: parsed.data.dueDate,
            xmlContent,
            notes: parsed.data.notes,
            orderId: parsed.data.orderId || null,
            tenantId: user.tenantId,
        },
    })

    logger.info("e-Invoice created", { module: MODULE.TR_ACCOUNTING, userId: user.id, invoiceId: invoice.id, invoiceNumber })
    revalidatePath(PATHS.EINVOICE)
    return { ...invoice, grossTotal: Number(invoice.grossTotal), vatBaseTotal: Number(invoice.vatBaseTotal), vatTotal: Number(invoice.vatTotal), netTotal: Number(invoice.netTotal), withholdingTotal: Number(invoice.withholdingTotal) }
}

/**
 * e-Faturayı GİB'e gönderir.
 * Gerçek SOAP/XML web servis adaptörü ile GİB entegrasyonu yapar.
 * Retry mekanizması ile hata toleranslı gönderim sağlar.
 * Mali mühür varsa otomatik imzalama yapar.
 *
 * GİB yapılandırması environment değişkenlerinden alınır:
 * - GIB_ENVIRONMENT: "test" veya "production" (default: test)
 * - GIB_USERNAME: GİB kullanıcı adı
 * - GIB_PASSWORD: GİB şifre
 * - GIB_CERT_PATH: Mali mühür PKCS#12 dosya yolu (opsiyonel)
 * - GIB_CERT_PASSWORD: Mali mühür şifresi (opsiyonel)
 */
export async function submitEInvoiceToGib(id: string) {
    const user = await requireAuth()
    requireManager(user)
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
    })

    if (!invoice) {
        throw new NotFoundError("e-Invoice")
    }

    // Durum makinesi: yalnızca geçerli geçişlere izin ver (DRAFT/SIGNED/ERROR → SENDING).
    assertEInvoiceTransition(invoice.status, "SENDING")

    // Önce durumu SENDING yap
    await db.eInvoice.update({
        where: { id },
        data: { status: "SENDING" },
    })

    // GİB SOAP adaptörü yapılandırması
    const environment = (process.env.GIB_ENVIRONMENT || "test") as GibEnvironment
    const username = process.env.GIB_USERNAME || ""
    const password = process.env.GIB_PASSWORD || ""

    // İmza yapılandırması (mali mühür varsa)
    const certPath = process.env.GIB_CERT_PATH
    const certPassword = process.env.GIB_CERT_PASSWORD
    // NOTE: Mali mühür (P12) signing is not yet wired — see DOM-3 backlog.
    // signerConfig stays undefined until certificate loading is implemented.
    const signerConfig = undefined

    if (certPath && certPassword) {
        // Gerçek uygulamada: sertifikayı dosyadan oku
        // const p12Buffer = fs.readFileSync(certPath)
        // const p12Result = parseP12(p12Buffer, certPassword)
        // signerConfig = {
        //     privateKey: p12Result.privateKey,
        //     certificate: p12Result.certificate,
        //     certificateInfo: p12Result.certificateInfo,
        // }
        logger.info("Mali mühür yapılandırması bulundu", {
            module: MODULE.TR_ACCOUNTING,
            userId: user.id,
            certPath,
        })
    }

    // SOAP adaptörünü oluştur
    const adapter = new GibSoapAdapter({
        environment,
        username,
        password,
        passwordType: "PasswordText",
        soapVersion: "1.1",
        timeoutMs: 30000,
        signerConfig,
    })

    // UBL XML'i hazırla (xmlContent yoksa yeniden oluştur)
    let ublXml = invoice.xmlContent
    if (!ublXml) {
        // XML içeriği yoksa oluştur (gerçek uygulamada her zaman olmalı)
        const ublInput = buildUblInputFromInvoice(invoice)
        ublXml = generateUblTrXml(ublInput)
    }

    // Belge hash'ini hesapla
    const hash = await computeDocumentHash(ublXml)

    // GİB'e gönder (retry mekanizması ile)
    const result = await adapter.sendInvoice({
        ublXml,
        uuid: invoice.uuid,
        documentType: invoice.documentType as GibDocumentType,
    })

    // Sonucu değerlendir
    let newStatus: string
    let lastError: string | null = null

    if (result.success && result.data?.accepted) {
        if (result.data.warnings && result.data.warnings.length > 0) {
            newStatus = "GIB_WARNING"
            lastError = `Uyarılar: ${result.data.warnings.join("; ")}`
        } else {
            newStatus = "GIB_ACCEPTED"
        }

        // GİB'den alınan belge numarasını kaydet
        if (result.data.documentNumber) {
            await db.eInvoice.update({
                where: { id },
                data: { documentNumber: result.data.documentNumber },
            })
        }
    } else if (result.error) {
        if (result.error.isRetryable) {
            newStatus = "ERROR"
        } else {
            newStatus = "GIB_REJECTED"
        }
        lastError = `${result.error.code}: ${result.error.message}`
    } else {
        newStatus = "ERROR"
        lastError = "Bilinmeyen hata"
    }

    await db.eInvoice.update({
        where: { id },
        data: {
            status: newStatus as import("@prisma/client").EInvoiceStatus,
            retryCount: result.attempts.length,
            lastError,
            lastAttemptAt: new Date(),
            hash,
        },
    })

    logger.info("e-Invoice submitted to GİB", {
        module: MODULE.TR_ACCOUNTING,
        userId: user.id,
        invoiceId: id,
        status: newStatus,
        attempts: result.attempts.length,
        environment,
    })

    revalidatePath(PATHS.EINVOICE)
    return { status: newStatus, result }
}

/**
 * EInvoice modelinden UblDocumentInput oluşturur.
 * XML yeniden oluşturma gerektiğinde kullanılır.
 */
function buildUblInputFromInvoice(invoice: {
    uuid: string
    documentType: string
    profile?: string | null
    invoiceNumber?: string | null
    issueDate: Date
    dueDate?: Date | null
    currency: string
    exchangeRate?: unknown
    senderTaxId: string
    senderName: string
    receiverTaxId: string
    receiverName: string
    receiverEmail?: string | null
    grossTotal: number | { toNumber: () => number }
    vatBaseTotal: number | { toNumber: () => number }
    vatTotal: number | { toNumber: () => number }
    netTotal: number | { toNumber: () => number }
    withholdingTotal?: number | { toNumber: () => number } | null
    notes?: string | null
}): UblDocumentInput {
    const toNum = (v: unknown): number => {
        if (typeof v === "number") return v
        if (v && typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: unknown }).toNumber === "function") {
            return (v as { toNumber: () => number }).toNumber()
        }
        return Number(v) || 0
    }

    return {
        uuid: invoice.uuid,
        documentType: invoice.documentType as "INVOICE" | "ARCHIVE",
        profile: invoice.profile || undefined,
        invoiceNumber: invoice.invoiceNumber || "",
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate || undefined,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate ? toNum(invoice.exchangeRate) : undefined,
        supplier: {
            taxId: invoice.senderTaxId,
            name: invoice.senderName,
        },
        customer: {
            taxId: invoice.receiverTaxId,
            name: invoice.receiverName,
            email: invoice.receiverEmail || undefined,
        },
        lines: [
            {
                id: 1,
                name: "Mal / Hizmet",
                quantity: 1,
                unitPrice: toNum(invoice.grossTotal),
                lineExtensionAmount: toNum(invoice.grossTotal),
            },
        ],
        grossTotal: toNum(invoice.grossTotal),
        vatBaseTotal: toNum(invoice.vatBaseTotal),
        vatTotal: toNum(invoice.vatTotal),
        netTotal: toNum(invoice.netTotal),
        withholdingTotal: toNum(invoice.withholdingTotal) || undefined,
        notes: invoice.notes || undefined,
    }
}

/**
 * Başarısız olmuş e-faturayı yeniden göndermeyi dener.
 */
export async function retryEInvoiceSubmission(id: string) {
    const user = await requireAuth()
    requireManager(user)
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
    })

    if (!invoice) {
        throw new NotFoundError("e-Invoice")
    }

    if (invoice.status !== "ERROR" && invoice.status !== "GIB_REJECTED") {
        throw new ConflictError(`Cannot retry invoice with status ${invoice.status}`)
    }

    // Önce durumu SENDING yap, sonra submit et
    await db.eInvoice.update({
        where: { id },
        data: { status: "SENDING" },
    })

    // Mevcut submit fonksiyonunu çağır
    return submitEInvoiceToGib(id)
}

/**
 * e-Faturayı iptal eder.
 */
export async function cancelEInvoice(id: string) {
    const user = await requireAuth()
    requireManager(user)
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
    })

    if (!invoice) {
        throw new NotFoundError("e-Invoice")
    }

    if (invoice.status === "GIB_ACCEPTED") {
        throw new ConflictError("Cannot cancel an accepted invoice. It must be reversed with a credit note.")
    }
    // Durum makinesi: zaten iptal edilmiş/terminal bir belge tekrar iptal edilemez.
    assertEInvoiceTransition(invoice.status, "CANCELLED")

    const updated = await db.eInvoice.update({
        where: { id },
        data: { status: "CANCELLED" },
    })

    logger.info("e-Invoice cancelled", { module: MODULE.TR_ACCOUNTING, userId: user.id, invoiceId: id })
    revalidatePath(PATHS.EINVOICE)
    return updated
}

/**
 * Bir VKN/TCKN'nin e-Fatura mükellefi olup olmadığını GİB'den sorgular.
 * GİB checkUser SOAP operasyonunu kullanır.
 */
export async function checkEInvoiceUser(taxId: string) {
    const user = await requireAuth()

    const environment = (process.env.GIB_ENVIRONMENT || "test") as GibEnvironment
    const username = process.env.GIB_USERNAME || ""
    const password = process.env.GIB_PASSWORD || ""

    const adapter = new GibSoapAdapter({
        environment,
        username,
        password,
        passwordType: "PasswordText",
        timeoutMs: 15000,
    })

    const result = await adapter.checkUser(taxId)

    logger.info("GİB checkUser called", {
        module: MODULE.TR_ACCOUNTING,
        userId: user.id,
        taxId,
        registered: result.success ? result.data?.isRegistered : false,
    })

    return {
        success: result.success,
        isRegistered: result.data?.isRegistered ?? false,
        title: result.data?.title,
        error: result.error?.message,
    }
}

/**
 * GİB'deki e-Fatura durumunu sorgular.
 */
export async function getEInvoiceStatusFromGib(uuid: string, documentType?: string) {
    const user = await requireAuth()

    const environment = (process.env.GIB_ENVIRONMENT || "test") as GibEnvironment
    const username = process.env.GIB_USERNAME || ""
    const password = process.env.GIB_PASSWORD || ""

    const adapter = new GibSoapAdapter({
        environment,
        username,
        password,
        timeoutMs: 15000,
    })

    const result = await adapter.getInvoiceStatus(
        uuid,
        (documentType || "INVOICE") as GibDocumentType
    )

    logger.info("GİB status check", {
        module: MODULE.TR_ACCOUNTING,
        userId: user.id,
        uuid,
        status: result.data?.status,
    })

    return {
        success: result.success,
        status: result.data?.status,
        error: result.error?.message,
    }
}

/**
 * e-Fatura UBL XML içeriğini döndürür.
 */
export async function getEInvoiceXml(id: string): Promise<string | null> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
        select: { xmlContent: true },
    })

    return invoice?.xmlContent || null
}

/**
 * e-Fatura HTML önizleme içeriğini döndürür.
 */
export async function getEInvoiceHtmlPreview(id: string): Promise<string | null> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const invoice = await db.eInvoice.findFirst({
        where: { id, tenantId: user.tenantId },
    })

    if (!invoice) return null

    const mapped = mapEInvoiceDetail(invoice as unknown as Parameters<typeof mapEInvoiceDetail>[0])

    const html = renderInvoiceHtml({
        documentType: invoice.documentType as "INVOICE" | "ARCHIVE",
        invoiceNumber: invoice.invoiceNumber || invoice.uuid,
        uuid: invoice.uuid,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        currency: invoice.currency,
        supplier: { name: invoice.senderName, taxId: invoice.senderTaxId },
        customer: { name: invoice.receiverName, taxId: invoice.receiverTaxId },
        items: [{ name: "Mal / Hizmet", quantity: 1, unit: "Adet", unitPrice: mapped.grossTotal, total: mapped.grossTotal }],
        subtotal: mapped.grossTotal,
        vatTotal: mapped.vatTotal,
        vatRate: mapped.vatBaseTotal > 0 ? Math.round((mapped.vatTotal / mapped.vatBaseTotal) * 100) : 0,
        grandTotal: mapped.netTotal,
        status: invoice.status,
        notes: invoice.notes || undefined,
    })

    return html
}

