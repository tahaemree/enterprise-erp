"use server"

import { revalidatePath } from "next/cache"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireManager } from "@/lib/auth-utils"
import logger from "@/lib/logger"
import crypto from "crypto"
import {
    eInvoiceSchema,
    type EInvoiceFormValues,
} from "@/lib/validations/tr-accounting"
import { fromZodError } from "@/lib/errors"
import { MODULE, PATHS } from "@/lib/constants"

import {
    generateDespatchAdviceXml,
    generateGibUuid,
    type UblDocumentInput,
    type UblInvoiceLine,
} from "@/lib/services/ubl-tr-engine"

import {
    mapEInvoice,
    type EInvoiceWithMapped,
} from "./e-invoice-mappers"

// ==================== E-İRSALİYE ====================
/**
 * e-İrsaliye listesini döndürür.
 */
export async function getDespatchAdvices(): Promise<EInvoiceWithMapped[]> {
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    const data = await db.eInvoice.findMany({
        where: { documentType: "DESPATCH_ADVICE" },
        orderBy: { createdAt: "desc" },
    })

    return data.map(mapEInvoice)
}

/**
 * Yeni bir e-İrsaliye oluşturur.
 */
export async function createDespatchAdvice(data: EInvoiceFormValues) {
    const user = await requireAuth()
    requireManager(user)
    const db = getTenantPrisma(user.tenantId)

    // İrsaliye için documentType'ı DESPATCH_ADVICE olarak zorla
    const adviceData = { ...data, documentType: "DESPATCH_ADVICE" }
    const parsed = eInvoiceSchema.safeParse(adviceData)
    if (!parsed.success) throw fromZodError(parsed.error)

    const uuid = generateGibUuid()
    const randomSeq = crypto.randomInt(1, 999999999)
    const despatchNumber = `IRS${new Date().getFullYear()}${String(randomSeq).padStart(9, "0")}`

    // XML oluştur
    const supplier = await db.user.findUnique({
        where: { id: user.id },
        include: { tenant: true },
    })

    const supplierName = supplier?.tenant?.name || user.tenantName || "İşletme"
    const senderTaxId = supplier?.tenant?.taxId || "11111111111"

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
        documentType: "DESPATCH_ADVICE",
        profile: "TEMELFATURA",
        invoiceNumber: despatchNumber,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        currency: parsed.data.currency,
        exchangeRate: parsed.data.exchangeRate,
        supplier: { taxId: senderTaxId, name: supplierName, email: user.email || undefined },
        customer: { taxId: parsed.data.receiverTaxId, name: parsed.data.receiverName, email: parsed.data.receiverEmail || undefined },
        lines: ublLines,
        grossTotal: parsed.data.grossTotal,
        vatBaseTotal: parsed.data.vatBaseTotal,
        vatTotal: parsed.data.vatTotal,
        netTotal: parsed.data.netTotal,
        notes: parsed.data.notes,
    }

    const xmlContent = generateDespatchAdviceXml(ublInput)

    const advice = await db.eInvoice.create({
        data: {
            uuid,
            documentType: "DESPATCH_ADVICE",
            profile: "TEMELFATURA",
            invoiceNumber: despatchNumber,
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
            withholdingTotal: 0,
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

    logger.info("e-DespatchAdvice created", { module: MODULE.TR_ACCOUNTING, userId: user.id, adviceId: advice.id })
    revalidatePath(PATHS.DESPATCH_ADVICE)
    return advice
}
