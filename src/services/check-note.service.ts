import { getTenantPrisma } from "@/lib/prisma"
import { CheckNoteFormValues } from "@/lib/validations/finance"
import { encrypt, decrypt } from "@/lib/encryption"
import { Money } from "@/lib/money"
import type { CheckNoteType, CheckDirection, CheckNoteStatus } from "@prisma/client"

export class CheckNoteService {
    static async getCheckNotes(tenantId: string) {
        const db = getTenantPrisma(tenantId)
        const notes = await db.checkPromissoryNote.findMany({
            orderBy: { maturityDate: "asc" },
        })

        return notes.map(note => ({
            ...note,
            issuerTaxId: note.issuerTaxId ? decrypt(note.issuerTaxId) || "N/A" : null,
            amount: Number(note.amount)
        }))
    }

    static async getCheckNoteById(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        const note = await db.checkPromissoryNote.findUnique({
            where: { id, tenantId }
        })

        if (!note) return null

        return {
            ...note,
            issuerTaxId: note.issuerTaxId ? decrypt(note.issuerTaxId) || "" : "",
            amount: Number(note.amount)
        }
    }

    static async createCheckNote(tenantId: string, data: CheckNoteFormValues) {
        const db = getTenantPrisma(tenantId)
        
        // KVKK Encryption for Tax ID/TCKN
        const encryptedTaxId = data.issuerTaxId ? encrypt(data.issuerTaxId) || data.issuerTaxId : null

        return await db.checkPromissoryNote.create({
            data: {
                tenantId,
                type: data.type as CheckNoteType,
                direction: data.direction as CheckDirection,
                serialNumber: data.serialNumber,
                bankName: data.bankName,
                bankBranch: data.bankBranch,
                accountNumber: data.accountNumber,
                issuerName: data.issuerName,
                issuerTaxId: encryptedTaxId,
                amount: new Money(data.amount).getValue(),
                currency: data.currency,
                issueDate: data.issueDate,
                maturityDate: data.maturityDate,
                status: data.status as CheckNoteStatus,
                notes: data.notes
            }
        })
    }

    static async updateCheckNoteStatus(tenantId: string, id: string, status: string) {
        const db = getTenantPrisma(tenantId)
        return await db.checkPromissoryNote.update({
            where: { id, tenantId },
            data: { status: status as CheckNoteStatus }
        })
    }

    static async deleteCheckNote(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        return await db.checkPromissoryNote.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }
}
