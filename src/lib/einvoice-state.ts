import type { EInvoiceStatus } from "@prisma/client"
import { ConflictError } from "@/lib/errors"

/**
 * e-Belge (e-Fatura / e-Arşiv / e-İrsaliye) durum makinesi.
 *
 * GİB iş akışındaki geçerli durum geçişlerini merkezi ve tek noktada tanımlar.
 * Servis/aksiyon katmanı her `status` güncellemesinden önce
 * `assertEInvoiceTransition` çağırarak geçersiz geçişleri (ör. iptal edilmiş bir
 * faturayı tekrar göndermek) engeller.
 *
 * Terminal durumlar:
 *   - GIB_ACCEPTED → geçiş yok (iptal yerine iade/ters faturası kesilir)
 *   - CANCELLED    → geçiş yok
 */
export const EINVOICE_TRANSITIONS: Record<EInvoiceStatus, readonly EInvoiceStatus[]> = {
    DRAFT: ["PENDING_SIGN", "SIGNED", "SENDING", "CANCELLED"],
    PENDING_SIGN: ["SIGNED", "SENDING", "CANCELLED", "ERROR"],
    SIGNED: ["SENDING", "CANCELLED", "ERROR"],
    SENDING: ["SENT_TO_GIB", "GIB_ACCEPTED", "GIB_REJECTED", "GIB_WARNING", "ERROR", "CANCELLED"],
    SENT_TO_GIB: ["GIB_ACCEPTED", "GIB_REJECTED", "GIB_WARNING", "ERROR", "CANCELLED"],
    GIB_WARNING: ["GIB_ACCEPTED", "CANCELLED", "ERROR"],
    GIB_REJECTED: ["DRAFT", "CANCELLED"],
    GIB_ACCEPTED: [],
    ERROR: ["DRAFT", "SENDING", "CANCELLED"],
    CANCELLED: [],
}

/** Returns true if `from → to` is a valid e-Invoice status transition. */
export function canTransitionEInvoice(from: EInvoiceStatus, to: EInvoiceStatus): boolean {
    return EINVOICE_TRANSITIONS[from]?.includes(to) ?? false
}

/** Throws ConflictError if `from → to` is not a valid transition. */
export function assertEInvoiceTransition(from: EInvoiceStatus, to: EInvoiceStatus): void {
    if (!canTransitionEInvoice(from, to)) {
        throw new ConflictError(`Geçersiz e-Belge durum geçişi: ${from} → ${to}`)
    }
}
