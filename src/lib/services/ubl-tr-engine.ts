/**
 * FAZ 4 — UBL TR 2.1 XML Şema Oluşturma Motoru
 *
 * e-Fatura, e-Arşiv ve e-İrsaliye için UBL TR 2.1 XML şeması üretir.
 * - UBL 2.1 şemasına uygun XML çıktısı
 * - e-Fatura (INVOICE), e-Arşiv (ARCHIVE), e-İrsaliye (DESPATCH_ADVICE)
 * - Türk mali mevzuatına uygun alanlar (VKN, TCKN, özel matrah, tevkifat)
 */

import crypto from "node:crypto"

// ==================== TYPES ====================

export type UblDocumentType = "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE"

export interface UblParty {
    taxId: string
    taxIdScheme?: "VKN" | "TCKN"
    name: string
    street?: string
    city?: string
    country?: string
    phone?: string
    email?: string
}

export interface UblTaxLine {
    taxAmount: number
    taxRate: number
    taxCode?: string
    taxName?: string
}

export interface UblInvoiceLine {
    id: number
    name: string
    quantity: number
    unitCode?: string // C62 = adet, KGM = kg, etc.
    unitPrice: number
    lineExtensionAmount: number
    taxLines?: UblTaxLine[]
}

export interface UblWithholding {
    amount: number
    ratio: string
    description?: string
}

export interface UblDocumentInput {
    uuid: string
    documentType: UblDocumentType
    profile?: string // TEMELFATURA, TICARIFATURA, EARSIVFATURA, IHRACAT
    invoiceNumber: string
    issueDate: Date
    issueTime?: string
    dueDate?: Date
    currency: string
    exchangeRate?: number

    supplier: UblParty
    customer: UblParty

    lines: UblInvoiceLine[]

    grossTotal: number
    vatBaseTotal: number
    vatTotal: number
    netTotal: number
    withholdingTotal?: number
    withholdingLines?: UblWithholding[]

    notes?: string
    orderReference?: string
}

// ==================== UBL TR 2.1 GENERATOR ====================

/**
 * UBL TR 2.1 XML şeması oluşturur.
 * e-Fatura, e-Arşif veya e-İrsaliye tipinde belge üretir.
 */
export function generateUblTrXml(input: UblDocumentInput): string {
    const lines: string[] = []

    const openingTag = input.documentType === "DESPATCH_ADVICE"
        ? "DespatchAdvice"
        : "Invoice"

    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
    lines.push(`<${openingTag} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${openingTag}-2"`)
    lines.push(`  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"`)
    lines.push(`  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"`)
    lines.push(`  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"`)
    lines.push(`  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"`)
    lines.push(`  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`)

    // UBL Extension
    lines.push(`  <ext:UBLExtensions>`)
    lines.push(`    <ext:UBLExtension>`)
    lines.push(`      <ext:ExtensionContent />`)
    lines.push(`    </ext:UBLExtension>`)
    lines.push(`  </ext:UBLExtensions>`)

    // Basic fields
    lines.push(`  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>`)
    lines.push(`  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>`)
    lines.push(`  <cbc:ProfileID>${escapeXml(input.profile || "")}</cbc:ProfileID>`)
    lines.push(`  <cbc:ID>${escapeXml(input.invoiceNumber)}</cbc:ID>`)
    lines.push(`  <cbc:CopyIndicator>false</cbc:CopyIndicator>`)
    lines.push(`  <cbc:UUID>${escapeXml(input.uuid)}</cbc:UUID>`)
    lines.push(`  <cbc:IssueDate>${formatDate(input.issueDate)}</cbc:IssueDate>`)
    lines.push(`  <cbc:IssueTime>${input.issueTime || formatTime(input.issueDate)}</cbc:IssueTime>`)

    if (input.dueDate) {
        lines.push(`  <cbc:DueDate>${formatDate(input.dueDate)}</cbc:DueDate>`)
    }

    const invoiceTypeCode = getInvoiceTypeCode(input.documentType)
    lines.push(`  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>`)
    lines.push(`  <cbc:DocumentCurrencyCode>${escapeXml(input.currency)}</cbc:DocumentCurrencyCode>`)

    if (input.exchangeRate && input.exchangeRate !== 1) {
        lines.push(`  <cbc:PricingCurrencyCode>${escapeXml(input.currency)}</cbc:PricingCurrencyCode>`)
    }

    lines.push(`  <cbc:LineCountNumeric>${input.lines.length}</cbc:LineCountNumeric>`)

    // Notes
    if (input.notes) {
        lines.push(`  <cbc:Note>${escapeXml(input.notes)}</cbc:Note>`)
    }

    if (input.withholdingTotal && input.withholdingTotal > 0) {
        lines.push(`  <cbc:Note>TEVKIFAT UYGULANMISTIR</cbc:Note>`)
    }

    if (input.orderReference) {
        lines.push(`  <cac:OrderReference>`)
        lines.push(`    <cbc:ID>${escapeXml(input.orderReference)}</cbc:ID>`)
        lines.push(`  </cac:OrderReference>`)
    }

    // AccountingSupplierParty
    lines.push(`  <cac:AccountingSupplierParty>`)
    lines.push(`    <cbc:CustomerAssignedAccountID>${escapeXml(input.supplier.taxId)}</cbc:CustomerAssignedAccountID>`)
    lines.push(`    <cac:Party>`)
    lines.push(`      <cac:PartyIdentification>`)
    lines.push(`        <cbc:ID schemeID="${input.supplier.taxIdScheme || "VKN"}">${escapeXml(input.supplier.taxId)}</cbc:ID>`)
    lines.push(`      </cac:PartyIdentification>`)
    lines.push(`      <cac:PartyName>`)
    lines.push(`        <cbc:Name>${escapeXml(input.supplier.name)}</cbc:Name>`)
    lines.push(`      </cac:PartyName>`)
    lines.push(`      <cac:PostalAddress>`)
    lines.push(`        <cbc:StreetName>${escapeXml(input.supplier.street || "-")}</cbc:StreetName>`)
    lines.push(`        <cbc:CityName>${escapeXml(input.supplier.city || "-")}</cbc:CityName>`)
    lines.push(`        <cbc:Country>${escapeXml(input.supplier.country || "Türkiye")}</cbc:Country>`)
    lines.push(`      </cac:PostalAddress>`)
    if (input.supplier.phone || input.supplier.email) {
        lines.push(`      <cac:Contact>`)
        if (input.supplier.phone) lines.push(`        <cbc:Telephone>${escapeXml(input.supplier.phone)}</cbc:Telephone>`)
        if (input.supplier.email) lines.push(`        <cbc:ElectronicMail>${escapeXml(input.supplier.email)}</cbc:ElectronicMail>`)
        lines.push(`      </cac:Contact>`)
    }
    lines.push(`    </cac:Party>`)
    lines.push(`  </cac:AccountingSupplierParty>`)

    // AccountingCustomerParty
    lines.push(`  <cac:AccountingCustomerParty>`)
    lines.push(`    <cbc:CustomerAssignedAccountID>${escapeXml(input.customer.taxId)}</cbc:CustomerAssignedAccountID>`)
    lines.push(`    <cac:Party>`)
    lines.push(`      <cac:PartyIdentification>`)
    lines.push(`        <cbc:ID schemeID="${input.customer.taxIdScheme || "VKN"}">${escapeXml(input.customer.taxId)}</cbc:ID>`)
    lines.push(`      </cac:PartyIdentification>`)
    lines.push(`      <cac:PartyName>`)
    lines.push(`        <cbc:Name>${escapeXml(input.customer.name)}</cbc:Name>`)
    lines.push(`      </cac:PartyName>`)
    lines.push(`      <cac:PostalAddress>`)
    lines.push(`        <cbc:StreetName>${escapeXml(input.customer.street || "-")}</cbc:StreetName>`)
    lines.push(`        <cbc:CityName>${escapeXml(input.customer.city || "-")}</cbc:CityName>`)
    lines.push(`        <cbc:Country>${escapeXml(input.customer.country || "Türkiye")}</cbc:Country>`)
    lines.push(`      </cac:PostalAddress>`)
    if (input.customer.email) {
        lines.push(`      <cac:Contact>`)
        lines.push(`        <cbc:ElectronicMail>${escapeXml(input.customer.email)}</cbc:ElectronicMail>`)
        lines.push(`      </cac:Contact>`)
    }
    lines.push(`    </cac:Party>`)
    lines.push(`  </cac:AccountingCustomerParty>`)

    // TaxTotal
    lines.push(`  <cac:TaxTotal>`)
    lines.push(`    <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${input.vatTotal.toFixed(2)}</cbc:TaxAmount>`)
    if (input.vatBaseTotal > 0) {
        // SubTotal for each tax line
        lines.push(`    <cac:TaxSubtotal>`)
        lines.push(`      <cbc:TaxableAmount currencyID="${escapeXml(input.currency)}">${input.vatBaseTotal.toFixed(2)}</cbc:TaxableAmount>`)
        lines.push(`      <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${input.vatTotal.toFixed(2)}</cbc:TaxAmount>`)
        lines.push(`      <cac:TaxCategory>`)
        lines.push(`        <cbc:ID>${getTaxCategoryCode(input.vatTotal, input.vatBaseTotal)}</cbc:ID>`)
        lines.push(`        <cac:TaxScheme>`)
        lines.push(`          <cbc:Name>KDV</cbc:Name>`)
        lines.push(`          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>`)
        lines.push(`        </cac:TaxScheme>`)
        lines.push(`      </cac:TaxCategory>`)
        lines.push(`    </cac:TaxSubtotal>`)
    }
    lines.push(`  </cac:TaxTotal>`)

    // Withholding tax total (varsa)
    if (input.withholdingLines && input.withholdingLines.length > 0) {
        lines.push(`  <cac:WithholdingTaxTotal>`)
        lines.push(`    <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${input.withholdingTotal?.toFixed(2) || "0.00"}</cbc:TaxAmount>`)
        for (const wh of input.withholdingLines) {
            lines.push(`    <cac:TaxSubtotal>`)
            lines.push(`      <cbc:TaxAmount currencyID="${escapeXml(input.currency)}">${wh.amount.toFixed(2)}</cbc:TaxAmount>`)
            lines.push(`      <cac:TaxCategory>`)
            lines.push(`        <cbc:ID>S</cbc:ID>`)
            lines.push(`        <cac:TaxScheme>`)
            lines.push(`          <cbc:Name>TEVKIFAT</cbc:Name>`)
            lines.push(`          <cbc:TaxTypeCode>9021</cbc:TaxTypeCode>`)
            lines.push(`        </cac:TaxScheme>`)
            lines.push(`      </cac:TaxCategory>`)
            lines.push(`    </cac:TaxSubtotal>`)
        }
        lines.push(`  </cac:WithholdingTaxTotal>`)
    }

    // LegalMonetaryTotal
    lines.push(`  <cac:LegalMonetaryTotal>`)
    lines.push(`    <cbc:LineExtensionAmount currencyID="${escapeXml(input.currency)}">${input.grossTotal.toFixed(2)}</cbc:LineExtensionAmount>`)
    lines.push(`    <cbc:TaxExclusiveAmount currencyID="${escapeXml(input.currency)}">${input.vatBaseTotal.toFixed(2)}</cbc:TaxExclusiveAmount>`)
    lines.push(`    <cbc:TaxInclusiveAmount currencyID="${escapeXml(input.currency)}">${input.netTotal.toFixed(2)}</cbc:TaxInclusiveAmount>`)
    lines.push(`    <cbc:PayableAmount currencyID="${escapeXml(input.currency)}">${input.netTotal.toFixed(2)}</cbc:PayableAmount>`)
    lines.push(`  </cac:LegalMonetaryTotal>`)

    // Invoice Lines
    for (const line of input.lines) {
        lines.push(`  <cac:${input.documentType === "DESPATCH_ADVICE" ? "DespatchLine" : "InvoiceLine"}>`)
        lines.push(`    <cbc:ID>${line.id}</cbc:ID>`)

        if (input.documentType !== "DESPATCH_ADVICE") {
            lines.push(`    <cbc:InvoicedQuantity unitCode="${line.unitCode || "C62"}">${line.quantity}</cbc:InvoicedQuantity>`)
        } else {
            lines.push(`    <cbc:DeliveredQuantity unitCode="${line.unitCode || "C62"}">${line.quantity}</cbc:DeliveredQuantity>`)
        }

        lines.push(`    <cbc:LineExtensionAmount currencyID="${escapeXml(input.currency)}">${line.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>`)
        lines.push(`    <cac:Item>`)
        lines.push(`      <cbc:Name>${escapeXml(line.name)}</cbc:Name>`)
        lines.push(`    </cac:Item>`)
        lines.push(`    <cac:Price>`)
        lines.push(`      <cbc:PriceAmount currencyID="${escapeXml(input.currency)}">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>`)
        lines.push(`    </cac:Price>`)
        lines.push(`  </cac:${input.documentType === "DESPATCH_ADVICE" ? "DespatchLine" : "InvoiceLine"}>`)
    }

    lines.push(`</${openingTag}>`)

    return lines.join("\n")
}

/**
 * e-Arşiv fatura için özel UBL TR XML oluşturur.
 * e-Arşiv faturalarında alıcı e-posta adresi zorunludur.
 */
export function generateEArsivXml(input: UblDocumentInput): string {
    // e-Arşiv için aynı UBL TR şeması kullanılır
    // Tek fark: ProfileID = EARSIVFATURA ve InvoiceTypeCode farklı olabilir
    const archiveInput: UblDocumentInput = {
        ...input,
        documentType: "ARCHIVE",
        profile: input.profile || "EARSIVFATURA",
    }
    return generateUblTrXml(archiveInput)
}

/**
 * e-İrsaliye için UBL XML oluşturur.
 */
export function generateDespatchAdviceXml(input: UblDocumentInput): string {
    const despatchInput: UblDocumentInput = {
        ...input,
        documentType: "DESPATCH_ADVICE",
        profile: input.profile || "TEMELFATURA",
    }
    return generateUblTrXml(despatchInput)
}

// ==================== HELPERS ====================

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function formatDate(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`
}

function getInvoiceTypeCode(docType: UblDocumentType): string {
    switch (docType) {
        case "INVOICE": return "SATIS"
        case "ARCHIVE": return "EARSIV"
        case "DESPATCH_ADVICE": return "SEVK"
    }
}

function getTaxCategoryCode(vatTotal: number, vatBase: number): string {
    if (vatTotal === 0 || vatBase === 0) return "K"
    const rate = Math.round((vatTotal / vatBase) * 100)
    if (rate <= 1) return "Z"
    if (rate <= 8) return "S"
    return "S" // Standart oran
}

/**
 * Benzersiz UUID (GİB formatında) oluşturur.
 */
export function generateGibUuid(): string {
    // Node.js crypto.randomUUID() — cryptographically secure, always available in Node.js.
    return crypto.randomUUID()
}

/**
 * Belge türüne göre profil seçeneklerini döndürür.
 */
export const PROFILE_OPTIONS: ReadonlyArray<{ readonly value: string; readonly label: string; readonly description: string }> = [
    { value: "TEMELFATURA", label: "Temel Fatura", description: "Temel e-fatura profili" },
    { value: "TICARIFATURA", label: "Ticari Fatura", description: "Ticari e-fatura (mal/hizmet)" },
    { value: "EARSIVFATURA", label: "e-Arşiv Fatura", description: "e-Arşiv fatura" },
    { value: "IHRACAT", label: "İhracat", description: "İhracat faturası" },
] as const

Object.freeze(PROFILE_OPTIONS)

export const UNIT_CODE_OPTIONS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
    { value: "C62", label: "Adet" },
    { value: "KGM", label: "Kilogram" },
    { value: "GRM", label: "Gram" },
    { value: "LTR", label: "Litre" },
    { value: "MTK", label: "Metrekare" },
    { value: "MTR", label: "Metre" },
    { value: "CEN", label: "Yüz adet" },
    { value: "SET", label: "Set" },
    { value: "DAY", label: "Gün" },
    { value: "MON", label: "Ay" },
] as const

Object.freeze(UNIT_CODE_OPTIONS)
