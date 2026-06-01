/**
 * FAZ 3 — BA/BS Form Üretim Motoru
 *
 * BA (Mal ve Hizmet Alış Bildirimi) ve BS (Mal ve Hizmet Satış Bildirimi)
 * formlarının otomatik olarak oluşturulması.
 *
 * - Verilen dönemdeki fatura/sipariş verilerinden BA/BS öğeleri oluşturur
 * - Vergi kimlik numarasına göre gruplama
 * - Belge sayısı ve toplam tutar hesaplama
 * - GİB XML formatında çıktı
 */

// ==================== TYPES ====================

export type BaBsPeriod = {
    year: number
    month: number
}

export interface BaBsSourceDocument {
    receiverTaxId?: string
    senderTaxId?: string
    receiverName: string
    senderName: string
    total: number
    invoiceNumber?: string
    date: Date
}

export interface BaBsGeneratedItem {
    taxId: string
    name: string
    documentCount: number
    totalAmount: number
}

export interface BaBsGenerationResult {
    formType: "BA" | "BS"
    year: number
    month: number
    items: BaBsGeneratedItem[]
    summary: {
        totalDocuments: number
        totalAmount: number
    }
}

// ==================== GENERATION ENGINE ====================

/**
 * Belge listesinden BA formu (alış bildirimi) oluşturur.
 * Tedarikçi/fatura kesen tarafın vergi kimlik numarasına göre gruplar.
 */
export function generateBaForm(
    period: BaBsPeriod,
    documents: BaBsSourceDocument[]
): BaBsGenerationResult {
    const grouped = new Map<string, { name: string; documents: number; total: number }>()

    for (const doc of documents) {
        const taxId = doc.senderTaxId || "UNKNOWN"
        const existing = grouped.get(taxId)

        if (existing) {
            existing.documents += 1
            existing.total += doc.total
        } else {
            grouped.set(taxId, {
                name: doc.senderName,
                documents: 1,
                total: doc.total,
            })
        }
    }

    const items: BaBsGeneratedItem[] = Array.from(grouped.entries())
        .map(([taxId, data]) => ({
            taxId,
            name: data.name,
            documentCount: data.documents,
            totalAmount: round(data.total),
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)

    const summary = items.reduce(
        (acc, item) => ({
            totalDocuments: acc.totalDocuments + item.documentCount,
            totalAmount: acc.totalAmount + item.totalAmount,
        }),
        { totalDocuments: 0, totalAmount: 0 }
    )

    return {
        formType: "BA",
        year: period.year,
        month: period.month,
        items,
        summary: { ...summary, totalAmount: round(summary.totalAmount) },
    }
}

/**
 * Belge listesinden BS formu (satış bildirimi) oluşturur.
 * Müşteri/fatura kesilen tarafın vergi kimlik numarasına göre gruplar.
 */
export function generateBsForm(
    period: BaBsPeriod,
    documents: BaBsSourceDocument[]
): BaBsGenerationResult {
    const grouped = new Map<string, { name: string; documents: number; total: number }>()

    for (const doc of documents) {
        const taxId = doc.receiverTaxId || "UNKNOWN"
        const existing = grouped.get(taxId)

        if (existing) {
            existing.documents += 1
            existing.total += doc.total
        } else {
            grouped.set(taxId, {
                name: doc.receiverName,
                documents: 1,
                total: doc.total,
            })
        }
    }

    const items: BaBsGeneratedItem[] = Array.from(grouped.entries())
        .map(([taxId, data]) => ({
            taxId,
            name: data.name,
            documentCount: data.documents,
            totalAmount: round(data.total),
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)

    const summary = items.reduce(
        (acc, item) => ({
            totalDocuments: acc.totalDocuments + item.documentCount,
            totalAmount: acc.totalAmount + item.totalAmount,
        }),
        { totalDocuments: 0, totalAmount: 0 }
    )

    return {
        formType: "BS",
        year: period.year,
        month: period.month,
        items,
        summary: { ...summary, totalAmount: round(summary.totalAmount) },
    }
}

// ==================== XML GENERATION ====================

/**
 * BA/BS formu için GİB formatında basit XML oluşturur.
 * Gerçek entegrasyonda UBL-TR şeması kullanılmalıdır.
 */
export function generateBaBsXml(result: BaBsGenerationResult): string {
    const formTypeLabel = result.formType === "BA" ? "Mal ve Hizmet Alış Bildirimi" : "Mal ve Hizmet Satış Bildirimi"
    const lines = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<BaBsForm xmlns="http://www.gib.gov.tr/ba-bs">`,
        `  <Header>`,
        `    <FormType>${result.formType}</FormType>`,
        `    <Period>${result.year}-${String(result.month).padStart(2, "0")}</Period>`,
        `    <Title>${formTypeLabel}</Title>`,
        `    <GenerationDate>${new Date().toISOString()}</GenerationDate>`,
        `  </Header>`,
        `  <Summary>`,
        `    <TotalDocuments>${result.summary.totalDocuments}</TotalDocuments>`,
        `    <TotalAmount>${result.summary.totalAmount.toFixed(2)}</TotalAmount>`,
        `  </Summary>`,
        `  <Items>`,
    ]

    for (const item of result.items) {
        lines.push(`    <Item>`)
        lines.push(`      <TaxId>${escapeXml(item.taxId)}</TaxId>`)
        lines.push(`      <Name>${escapeXml(item.name)}</Name>`)
        lines.push(`      <DocumentCount>${item.documentCount}</DocumentCount>`)
        lines.push(`      <TotalAmount>${item.totalAmount.toFixed(2)}</TotalAmount>`)
        lines.push(`    </Item>`)
    }

    lines.push(`  </Items>`)
    lines.push(`</BaBsForm>`)
    return lines.join("\n")
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

function round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}
