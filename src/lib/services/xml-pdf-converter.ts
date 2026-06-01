/**
 * FAZ 4 — XML/PDF Dönüşüm Motoru
 *
 * UBL-TR XML belgelerini HTML'e dönüştürür,
 * HTML'i PDF formatına çevirmek için hazırlar.
 *
 * Not: Gerçek PDF üretimi için sunucuda bir PDF kütüphanesi
 * (örn. puppeteer, wkhtmltopdf) gerekir. Bu modül:
 * - XML'den okunabilir HTML çıktısı üretir
 * - HTML'i string olarak döndürür (PDF oluşturma dışarıdan beslenir)
 * - Fatura/İrsaliye şablonlarını içerir
 */

// ==================== TYPES ====================

export interface DocumentTemplate {
    documentType: "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE"
    invoiceNumber: string
    uuid: string
    issueDate: string
    dueDate?: string
    currency: string

    supplier: {
        name: string
        taxId: string
        address?: string
        phone?: string
        email?: string
    }
    customer: {
        name: string
        taxId: string
        address?: string
        email?: string
    }

    items: Array<{
        name: string
        quantity: number
        unit: string
        unitPrice: number
        total: number
    }>

    subtotal: number
    vatTotal: number
    vatRate: number
    withholdingTotal?: number
    grandTotal: number

    notes?: string
    status?: string
}

// ==================== HTML TEMPLATES ====================

/**
 * UBL XML verilerini HTML fatura şablonuna dönüştürür.
 * PDF üretimi için hazır HTML çıktısı sağlar.
 */
export function renderInvoiceHtml(template: DocumentTemplate): string {
    const title = getDocumentTitle(template.documentType)

    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; color: #333; line-height: 1.5; margin: 0; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #1a56db; padding-bottom: 15px; }
  .header h1 { font-size: 18pt; color: #1a56db; margin: 0; }
  .header .meta { text-align: right; font-size: 9pt; color: #666; }
  .title { font-size: 14pt; font-weight: bold; margin-bottom: 20px; text-align: center; }
  .info-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
  .info-table td { width: 50%; vertical-align: top; padding: 5px 10px; font-size: 9pt; }
  .info-table .label { font-weight: bold; color: #555; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
  .items-table th { background: #1a56db; color: white; padding: 8px 10px; text-align: left; font-size: 9pt; }
  .items-table td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 9pt; }
  .items-table tr:nth-child(even) { background: #f9fafb; }
  .items-table .text-right { text-align: right; }
  .items-table .text-center { text-align: center; }
  .totals { width: 350px; margin-left: auto; border-collapse: collapse; }
  .totals td { padding: 6px 10px; font-size: 10pt; }
  .totals .label { text-align: right; color: #555; }
  .totals .value { text-align: right; font-weight: bold; }
  .totals .grand-total { font-size: 12pt; color: #1a56db; font-weight: bold; }
  .totals tr.border-top td { border-top: 2px solid #1a56db; }
  .footer { margin-top: 40px; font-size: 8pt; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 8pt; font-weight: bold; }
  .status-DRAFT { background: #f3f4f6; color: #666; }
  .status-SENT { background: #dbeafe; color: #1d4ed8; }
  .status-ACCEPTED { background: #dcfce7; color: #16a34a; }
  .withholding { color: #dc2626; font-size: 9pt; }
  .notes { margin-top: 20px; padding: 10px; background: #f9fafb; border-radius: 4px; font-size: 9pt; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p style="margin:2px 0;font-size:9pt;color:#666;">Belge No: ${escapeHtml(template.invoiceNumber)}</p>
    </div>
    <div class="meta">
      <div>UUID: ${escapeHtml(template.uuid)}</div>
      <div>Düzenlenme: ${template.issueDate}</div>
      ${template.dueDate ? `<div>Vade: ${template.dueDate}</div>` : ""}
      ${template.status ? `<div><span class="status-badge status-${template.status}">${template.status}</span></div>` : ""}
    </div>
  </div>

  <table class="info-table">
    <tr>
      <td>
        <div class="label">Satıcı / Düzenleyen</div>
        <div style="font-weight:bold;">${escapeHtml(template.supplier.name)}</div>
        <div>VKN: ${escapeHtml(template.supplier.taxId)}</div>
        ${template.supplier.address ? `<div>${escapeHtml(template.supplier.address)}</div>` : ""}
        ${template.supplier.phone ? `<div>Tel: ${escapeHtml(template.supplier.phone)}</div>` : ""}
        ${template.supplier.email ? `<div>E-posta: ${escapeHtml(template.supplier.email)}</div>` : ""}
      </td>
      <td>
        <div class="label">Alıcı / Müşteri</div>
        <div style="font-weight:bold;">${escapeHtml(template.customer.name)}</div>
        <div>VKN: ${escapeHtml(template.customer.taxId)}</div>
        ${template.customer.address ? `<div>${escapeHtml(template.customer.address)}</div>` : ""}
        ${template.customer.email ? `<div>E-posta: ${escapeHtml(template.customer.email)}</div>` : ""}
      </td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Mal / Hizmet</th>
        <th style="width:80px;" class="text-center">Miktar</th>
        <th style="width:100px;" class="text-right">Birim Fiyat</th>
        <th style="width:120px;" class="text-right">Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${template.items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="text-center">${item.quantity} ${escapeHtml(item.unit)}</td>
        <td class="text-right">${formatAmount(item.unitPrice, template.currency)}</td>
        <td class="text-right">${formatAmount(item.total, template.currency)}</td>
      </tr>
      `).join("\n      ")}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td class="label">Mal / Hizmet Toplamı:</td>
      <td class="value">${formatAmount(template.subtotal, template.currency)}</td>
    </tr>
    <tr>
      <td class="label">KDV (${template.vatRate}%):</td>
      <td class="value">${formatAmount(template.vatTotal, template.currency)}</td>
    </tr>
    ${template.withholdingTotal && template.withholdingTotal > 0 ? `
    <tr>
      <td class="label withholding">Tevkifat (-):</td>
      <td class="value withholding">${formatAmount(template.withholdingTotal, template.currency)}</td>
    </tr>` : ""}
    <tr class="border-top">
      <td class="label grand-total">Ödenecek Tutar:</td>
      <td class="value grand-total">${formatAmount(template.grandTotal, template.currency)}</td>
    </tr>
  </table>

  ${template.notes ? `<div class="notes"><strong>Not:</strong> ${escapeHtml(template.notes)}</div>` : ""}

  <div class="footer">
    <p>Bu belge ${escapeHtml(template.uuid)} UUID ile elektronik ortamda oluşturulmuştur.</p>
    <p>${new Date().toLocaleDateString("tr-TR")} tarihinde Deftra tarafından oluşturulmuştur.</p>
  </div>
</body>
</html>`
}

/**
 * e-İrsaliye için HTML şablonu oluşturur.
 */
export function renderDespatchAdviceHtml(template: DocumentTemplate): string {
    // İrsaliye şablonu — faturaya benzer, başlık farklı
    return renderInvoiceHtml({
        ...template,
        documentType: "DESPATCH_ADVICE",
    })
}

/**
 * Basit HTML'den düz metin çıktısı alır (PDF oluşturulamadığında yedek).
 */
export function convertHtmlToPlainText(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Belge türüne göre başlık döndürür.
 */
function getDocumentTitle(docType: string): string {
    switch (docType) {
        case "INVOICE": return "e-Fatura"
        case "ARCHIVE": return "e-Arşiv Fatura"
        case "DESPATCH_ADVICE": return "e-İrsaliye"
        default: return "e-Belge"
    }
}

/**
 * Tutarı para birimiyle formatlar.
 */
function formatAmount(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${amount.toFixed(2)} ${currency}`
    }
}

/**
 * Metni HTML enjeksiyonuna karşı kaçıklar.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
