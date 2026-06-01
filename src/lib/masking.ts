/**
 * Deftra — KVKK Veri Maskeleme Katmanı
 *
 * Turkish Personal Data Protection Law (KVKK) compliant data masking utilities.
 * Provides role-based masking for personally identifiable information (PII).
 *
 * Masking rules:
 * - ADMIN:   Full access — no masking
 * - MANAGER: Partial masking (e.g., phone: 555****001)
 * - USER:    Heavy masking (e.g., email: t***@example.com)
 * - VIEWER:  Maximum masking (e.g., name: J*** D***)
 */

import type { UserRole } from "@prisma/client"
import { ROLE_HIERARCHY } from "@/lib/constants"

// ─── Role Hierarchy Levels ────────────────────────────────────────────────

function getMaskLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role] ?? 0
}

// ─── Masking Thresholds ───────────────────────────────────────────────────
// Each PII field has a minimum role level that can see it unmasked.

const MASK_THRESHOLDS = {
    EMAIL_FULL: 50,         // MANAGER+ can see full email
    PHONE_FULL: 50,         // MANAGER+ can see full phone
    NAME_FULL: 100,         // ADMIN only can see full name
    TAX_ID_FULL: 100,       // ADMIN only can see full tax ID
    ADDRESS_FULL: 50,       // MANAGER+ can see full address
    BANK_ACCOUNT_FULL: 100, // ADMIN only can see full bank account
    SALARY_FULL: 100,       // ADMIN only can see salary
    NOTES_FULL: 50,         // MANAGER+ can see notes
} as const

// ─── Masking Functions ────────────────────────────────────────────────────

function maskEmail(email: string | null | undefined, level: number): string | null {
    if (!email) return null
    if (level >= MASK_THRESHOLDS.EMAIL_FULL) return email

    const [local, domain] = email.split("@")
    if (!domain) return "***"

    const maskedLocal = local!.length <= 2
        ? local![0]! + "***"
        : local![0]! + "***" + local![local!.length - 1]!

    return `${maskedLocal}@${domain}`
}

function maskPhone(phone: string | null | undefined, level: number): string | null {
    if (!phone) return null
    if (level >= MASK_THRESHOLDS.PHONE_FULL) return phone

    const cleaned = phone.replace(/[\s-]/g, "")
    if (cleaned.length <= 4) return "****"

    const prefix = cleaned.substring(0, 3)
    const suffix = cleaned.substring(cleaned.length - 2)
    return `${prefix}****${suffix}`
}

function maskName(firstName: string | null | undefined, lastName: string | null | undefined, level: number): { firstName: string | null; lastName: string | null } {
    let maskedFirst: string | null = firstName ?? null
    let maskedLast: string | null = lastName ?? null

    if (level >= MASK_THRESHOLDS.NAME_FULL) {
        return { firstName: maskedFirst, lastName: maskedLast }
    }

    if (firstName) {
        maskedFirst = firstName.length <= 1
            ? firstName[0]! + "***"
            : firstName[0]! + "***" + firstName[firstName.length - 1]!
    }
    if (lastName) {
        maskedLast = lastName.length <= 1
            ? lastName[0]! + "***"
            : lastName[0]! + "***" + lastName[lastName.length - 1]!
    }

    return { firstName: maskedFirst, lastName: maskedLast }
}

function maskTaxId(taxId: string | null | undefined, level: number): string | null {
    if (!taxId) return null
    if (level >= MASK_THRESHOLDS.TAX_ID_FULL) return taxId

    if (taxId.length <= 3) return "***" + taxId.substring(taxId.length - 1)
    return taxId.substring(0, 3) + "****" + taxId.substring(taxId.length - 2)
}

function maskAddress(address: string | null | undefined, level: number): string | null {
    if (!address) return null
    if (level >= MASK_THRESHOLDS.ADDRESS_FULL) return address

    if (address.length <= 5) return "*****"
    return address.substring(0, 5) + "*****"
}

function maskBankAccount(account: string | null | undefined, level: number): string | null {
    if (!account) return null
    if (level >= MASK_THRESHOLDS.BANK_ACCOUNT_FULL) return account

    if (account.length <= 4) return "****"
    return "****" + account.substring(account.length - 4)
}

function maskIban(iban: string | null | undefined, level: number): string | null {
    if (!iban) return null
    if (level >= MASK_THRESHOLDS.BANK_ACCOUNT_FULL) return iban

    if (iban.length <= 8) return "****"
    return iban.substring(0, 4) + "****" + iban.substring(iban.length - 4)
}

function maskSalary(salary: number | null | undefined, level: number): number | null {
    if (salary === null || salary === undefined) return null
    if (level >= MASK_THRESHOLDS.SALARY_FULL) return salary
    return 0 // Hide salary entirely from non-admin
}

function maskNotes(notes: string | null | undefined, level: number): string | null {
    if (!notes) return null
    if (level >= MASK_THRESHOLDS.NOTES_FULL) return notes
    return "[Gizli]"
}

function maskGenericString(value: string | null | undefined, level: number): string | null {
    if (!value) return null
    if (level >= MASK_THRESHOLDS.NAME_FULL) return value

    const trimmed = value.trim()
    if (trimmed.length <= 3) return "***"
    return trimmed[0]! + "***" + trimmed[trimmed.length - 1]!
}

// ─── Composable Masking Functions ─────────────────────────────────────────

export interface MaskedCustomer {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    company: string | null
    address: string | null
    taxId?: string | null
    notes: string | null
    [key: string]: unknown
}

/**
 * Masks customer PII data based on user role.
 * Returns a new object with masked fields; original is not mutated.
 */
export function maskCustomer<T extends MaskedCustomer>(
    customer: T,
    role: UserRole
): T {
    const level = getMaskLevel(role)
    const maskedName = maskName(customer.firstName, customer.lastName, level)

    return {
        ...customer,
        firstName: maskedName.firstName,
        lastName: maskedName.lastName,
        email: maskEmail(customer.email, level),
        phone: maskPhone(customer.phone, level),
        address: maskAddress(customer.address, level),
        notes: maskNotes(customer.notes, level),
    }
}

export interface MaskedEmployee {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    address: string | null
    salary?: number | null
    bankName?: string | null
    bankAccount?: string | null
    taxId?: string | null
    emergencyContact?: string | null
    emergencyPhone?: string | null
    notes: string | null
    [key: string]: unknown
}

/**
 * Masks employee PII data based on user role.
 */
export function maskEmployee<T extends MaskedEmployee>(
    employee: T,
    role: UserRole
): T {
    const level = getMaskLevel(role)
    const maskedName = maskName(employee.firstName, employee.lastName, level)

    return {
        ...employee,
        firstName: maskedName.firstName,
        lastName: maskedName.lastName,
        email: maskEmail(employee.email, level),
        phone: maskPhone(employee.phone, level),
        address: maskAddress(employee.address, level),
        salary: maskSalary(employee.salary as number | null | undefined, level),
        bankName: maskNotes(employee.bankName, level),
        bankAccount: maskBankAccount(employee.bankAccount, level),
        taxId: maskTaxId(employee.taxId, level),
        emergencyContact: maskGenericString(employee.emergencyContact, level),
        emergencyPhone: maskPhone(employee.emergencyPhone, level),
        notes: maskNotes(employee.notes, level),
    }
}

export interface MaskedUser {
    id: string
    name: string | null
    email: string | null
    image?: string | null
    [key: string]: unknown
}

/**
 * Masks user PII data based on user role.
 */
export function maskUser<T extends MaskedUser>(
    user: T,
    role: UserRole
): T {
    const level = getMaskLevel(role)

    return {
        ...user,
        name: level < MASK_THRESHOLDS.NAME_FULL && user.name
            ? user.name.length <= 2
                ? user.name[0]! + "***"
                : user.name[0]! + "***" + user.name[user.name.length - 1]!
            : user.name,
        email: maskEmail(user.email, level),
    }
}

export interface MaskedSupplier {
    id: string
    name: string | null
    contactName?: string | null
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
    [key: string]: unknown
}

/**
 * Masks supplier contact PII data based on user role.
 */
export function maskSupplier<T extends MaskedSupplier>(
    supplier: T,
    role: UserRole
): T {
    const level = getMaskLevel(role)

    return {
        ...supplier,
        contactName: level < MASK_THRESHOLDS.NAME_FULL && supplier.contactName
            ? supplier.contactName.length <= 2
                ? supplier.contactName[0]! + "***"
                : supplier.contactName[0]! + "***" + supplier.contactName[supplier.contactName.length - 1]!
            : supplier.contactName,
        email: maskEmail(supplier.email, level),
        phone: maskPhone(supplier.phone, level),
        address: maskAddress(supplier.address, level),
        notes: maskNotes(supplier.notes, level),
    }
}
