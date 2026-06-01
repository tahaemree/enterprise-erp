/**
 * Deftra — KVKK Maskeleme Katmanı Testleri
 *
 * Covers all masking functions at every role level (ADMIN, MANAGER, USER, VIEWER)
 * and edge cases (null, undefined, empty strings, short values).
 */

import { describe, it, expect } from "vitest"
import {
    maskCustomer,
    maskEmployee,
    maskUser,
    maskSupplier,
} from "@/lib/masking"
// ─── Fixtures ─────────────────────────────────────────────────────────────

const sampleCustomer = {
    id: "cust-1",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    email: "ahmet.yilmaz@example.com",
    phone: "+90 555 123 45 67",
    company: "Acme Corp",
    address: "İstiklal Cad. No:123 Beyoğlu/İstanbul",
    taxId: "1234567890",
    notes: "Özel müşteri notu",
    extraField: "should-be-preserved",
}

const sampleEmployee = {
    id: "emp-1",
    firstName: "Ayşe",
    lastName: "Demir",
    email: "ayse.demir@company.com",
    phone: "+90 532 987 65 43",
    address: "Bağdat Cad. No:456 Kadıköy/İstanbul",
    salary: 85000,
    bankName: "Ziraat Bankası",
    bankAccount: "TR123456789012345678901234",
    taxId: "9876543210",
    emergencyContact: "Mehmet Demir (Baba)",
    emergencyPhone: "+90 555 444 33 22",
    notes: "Performans bonusu bekleniyor",
}

const sampleUser = {
    id: "user-1",
    name: "Ali Veli",
    email: "ali.veli@example.com",
    image: null,
}

const sampleSupplier = {
    id: "sup-1",
    name: "Tedarik A.Ş.",
    contactName: "Zeynep Kaya",
    email: "zeynep.kaya@supplier.com",
    phone: "+90 216 444 55 66",
    address: "Sanayi Mah. Teknik Sok. No:7 Ümraniye/İstanbul",
    notes: "Vadeli ödeme anlaşması var",
}

// ─── maskCustomer ─────────────────────────────────────────────────────────

describe("maskCustomer", () => {
    it("ADMIN should see all fields unmasked", () => {
        const masked = maskCustomer(sampleCustomer, "ADMIN")
        expect(masked.firstName).toBe("Ahmet")
        expect(masked.lastName).toBe("Yılmaz")
        expect(masked.email).toBe("ahmet.yilmaz@example.com")
        expect(masked.phone).toBe("+90 555 123 45 67")
        expect(masked.address).toBe("İstiklal Cad. No:123 Beyoğlu/İstanbul")
        expect(masked.taxId).toBe("1234567890")
        expect(masked.notes).toBe("Özel müşteri notu")
    })

    it("MANAGER should see full email, phone, address — partial name masking", () => {
        const masked = maskCustomer(sampleCustomer, "MANAGER")
        // Email: MANAGER+ threshold is 50, so full email
        expect(masked.email).toBe("ahmet.yilmaz@example.com")
        // Phone: MANAGER+ threshold is 50, so full phone
        expect(masked.phone).toBe("+90 555 123 45 67")
        // Address: MANAGER+ threshold is 50, so full address
        expect(masked.address).toBe("İstiklal Cad. No:123 Beyoğlu/İstanbul")
        // Name: ADMIN-only threshold is 100, so masked
        expect(masked.firstName).toBe("A***t")
        expect(masked.lastName).toBe("Y***z")
        // Notes: MANAGER+ threshold is 50, so full
        expect(masked.notes).toBe("Özel müşteri notu")
    })

    it("USER should see heavy masking on all PII fields", () => {
        const masked = maskCustomer(sampleCustomer, "USER")
        // Email: masked for non-MANAGER
        expect(masked.email).toBe("a***z@example.com")
        // Phone: masked for non-MANAGER
        expect(masked.phone).toBe("+90****67")
        // Name: masked for non-ADMIN
        expect(masked.firstName).toBe("A***t")
        expect(masked.lastName).toBe("Y***z")
        // Address: masked for non-MANAGER
        expect(masked.address).toBe("İstik*****")
        // Notes: masked for non-MANAGER
        expect(masked.notes).toBe("[Gizli]")
    })

    it("VIEWER should see maximum masking", () => {
        const masked = maskCustomer(sampleCustomer, "VIEWER")
        expect(masked.email).toBe("a***z@example.com")
        expect(masked.phone).toBe("+90****67")
        expect(masked.firstName).toBe("A***t")
        expect(masked.lastName).toBe("Y***z")
        expect(masked.address).toBe("İstik*****")
        expect(masked.notes).toBe("[Gizli]")
    })

    it("should preserve non-PII fields", () => {
        const masked = maskCustomer(sampleCustomer, "VIEWER")
        expect(masked.id).toBe("cust-1")
        expect(masked.company).toBe("Acme Corp")
        // Extra field should be preserved through spread
        expect((masked as Record<string, unknown>).extraField).toBe("should-be-preserved")
    })

    it("should handle null values gracefully", () => {
        const customer = { ...sampleCustomer, firstName: null, email: null, phone: null, address: null, notes: null }
        const masked = maskCustomer(customer, "VIEWER")
        expect(masked.firstName).toBeNull()
        expect(masked.email).toBeNull()
        expect(masked.phone).toBeNull()
        expect(masked.address).toBeNull()
        expect(masked.notes).toBeNull()
    })

    it("should handle undefined optional fields gracefully", () => {
        const customer: Parameters<typeof maskCustomer>[0] = { id: "c1", firstName: "Test", lastName: "User", email: null, phone: null, company: null, address: null, notes: null }
        const masked = maskCustomer(customer, "VIEWER")
        expect((masked as Record<string, unknown>).taxId).toBeUndefined()
    })
})

// ─── maskEmployee ─────────────────────────────────────────────────────────

describe("maskEmployee", () => {
    it("ADMIN should see all fields unmasked", () => {
        const masked = maskEmployee(sampleEmployee, "ADMIN")
        expect(masked.firstName).toBe("Ayşe")
        expect(masked.lastName).toBe("Demir")
        expect(masked.email).toBe("ayse.demir@company.com")
        expect(masked.phone).toBe("+90 532 987 65 43")
        expect(masked.address).toBe("Bağdat Cad. No:456 Kadıköy/İstanbul")
        expect(masked.salary).toBe(85000)
        expect(masked.bankName).toBe("Ziraat Bankası")
        expect(masked.bankAccount).toBe("TR123456789012345678901234")
        expect(masked.taxId).toBe("9876543210")
        expect(masked.emergencyContact).toBe("Mehmet Demir (Baba)")
        expect(masked.emergencyPhone).toBe("+90 555 444 33 22")
    })

    it("MANAGER should see non-PII fields and salary notes — but not salary or bank details", () => {
        const masked = maskEmployee(sampleEmployee, "MANAGER")
        // Email: full for MANAGER+
        expect(masked.email).toBe("ayse.demir@company.com")
        // Phone: full for MANAGER+
        expect(masked.phone).toBe("+90 532 987 65 43")
        // Address: full for MANAGER+
        expect(masked.address).toBe("Bağdat Cad. No:456 Kadıköy/İstanbul")
        // Notes: full for MANAGER+
        expect(masked.notes).toBe("Performans bonusu bekleniyor")
        // Name: masked for non-ADMIN
        expect(masked.firstName).toBe("A***e")
        expect(masked.lastName).toBe("D***r")
        // Salary: ADMIN-only
        expect(masked.salary).toBe(0)
        // Bank name: masked for non-MANAGER (uses maskNotes internally — actually MANAGER threshold is 50)
        // maskNotes threshold is NOTES_FULL = 50 (MANAGER), so bankName should be visible
        expect(masked.bankName).toBe("Ziraat Bankası")
        // Bank account: ADMIN-only (threshold = 100)
        expect(masked.bankAccount).toBe("****" + sampleEmployee.bankAccount!.substring(sampleEmployee.bankAccount!.length - 4))
        // Tax ID: ADMIN-only
        expect(masked.taxId).toBe("987****10")
        // Emergency contact: ADMIN-only (uses maskGenericString which uses NAME_FULL threshold = 100)
        expect(masked.emergencyContact).toBe("M***)")
        // Emergency phone: MANAGER+ can see full phone (PHONE_FULL threshold = 50)
        expect(masked.emergencyPhone).toBe("+90 555 444 33 22")
    })

    it("USER should see heavily masked fields", () => {
        const masked = maskEmployee(sampleEmployee, "USER")
        expect(masked.email).toBe("a***r@company.com")
        expect(masked.phone).toBe("+90****43")
        // Employee type doesn't have 'name' — spread preserves original shape
        expect((masked as Record<string, unknown>).name).toBeUndefined()
        expect(masked.firstName).toBe("A***e")
        expect(masked.lastName).toBe("D***r")
        expect(masked.address).toBe("Bağda*****")
        expect(masked.salary).toBe(0)
        expect(masked.bankName).toBe("[Gizli]")
        expect(masked.bankAccount).toBe("****" + sampleEmployee.bankAccount!.substring(sampleEmployee.bankAccount!.length - 4))
        expect(masked.taxId).toBe("987****10")
        expect(masked.emergencyContact).toBe("M***)")
        expect(masked.emergencyPhone).toBe("+90****22")
        expect(masked.notes).toBe("[Gizli]")
    })

    it("VIEWER should see maximum masking", () => {
        const masked = maskEmployee(sampleEmployee, "VIEWER")
        expect(masked.email).toBe("a***r@company.com")
        expect(masked.phone).toBe("+90****43")
        expect(masked.firstName).toBe("A***e")
        expect(masked.lastName).toBe("D***r")
        expect(masked.address).toBe("Bağda*****")
        expect(masked.salary).toBe(0)
        expect(masked.bankName).toBe("[Gizli]")
        expect(masked.emergencyContact).toBe("M***)")
        expect(masked.notes).toBe("[Gizli]")
    })

    it("should handle null salary gracefully", () => {
        const employee = { ...sampleEmployee, salary: null }
        const masked = maskEmployee(employee, "ADMIN")
        expect(masked.salary).toBeNull()
    })

    it("should handle null fields gracefully", () => {
        const employee = {
            id: "e1",
            firstName: null,
            lastName: null,
            email: null,
            phone: null,
            address: null,
            notes: null,
        }
        const masked = maskEmployee(employee, "VIEWER")
        expect(masked.firstName).toBeNull()
        expect(masked.lastName).toBeNull()
        expect(masked.email).toBeNull()
        expect(masked.phone).toBeNull()
        expect(masked.address).toBeNull()
        expect(masked.notes).toBeNull()
    })
})

// ─── maskUser ─────────────────────────────────────────────────────────────

describe("maskUser", () => {
    it("ADMIN should see all fields unmasked", () => {
        const masked = maskUser(sampleUser, "ADMIN")
        expect(masked.name).toBe("Ali Veli")
        expect(masked.email).toBe("ali.veli@example.com")
    })

    it("MANAGER should see email unmasked but name masked", () => {
        const masked = maskUser(sampleUser, "MANAGER")
        expect(masked.email).toBe("ali.veli@example.com")
        expect(masked.name).toBe("A***i")
    })

    it("USER should see masked email and masked name", () => {
        const masked = maskUser(sampleUser, "USER")
        expect(masked.email).toBe("a***i@example.com")
        expect(masked.name).toBe("A***i")
    })

    it("VIEWER should see maximum masking", () => {
        const masked = maskUser(sampleUser, "VIEWER")
        expect(masked.email).toBe("a***i@example.com")
        expect(masked.name).toBe("A***i")
    })

    it("should handle null name gracefully", () => {
        const user = { ...sampleUser, name: null }
        const masked = maskUser(user, "VIEWER")
        expect(masked.name).toBeNull()
    })

    it("should handle null email gracefully", () => {
        const user = { ...sampleUser, email: null }
        const masked = maskUser(user, "ADMIN")
        expect(masked.email).toBeNull()
    })
})

// ─── maskSupplier ─────────────────────────────────────────────────────────

describe("maskSupplier", () => {
    it("ADMIN should see all fields unmasked", () => {
        const masked = maskSupplier(sampleSupplier, "ADMIN")
        expect(masked.name).toBe("Tedarik A.Ş.")
        expect(masked.contactName).toBe("Zeynep Kaya")
        expect(masked.email).toBe("zeynep.kaya@supplier.com")
        expect(masked.phone).toBe("+90 216 444 55 66")
        expect(masked.address).toBe("Sanayi Mah. Teknik Sok. No:7 Ümraniye/İstanbul")
        expect(masked.notes).toBe("Vadeli ödeme anlaşması var")
    })

    it("MANAGER should see full contact info but name masked", () => {
        const masked = maskSupplier(sampleSupplier, "MANAGER")
        expect(masked.email).toBe("zeynep.kaya@supplier.com")
        expect(masked.phone).toBe("+90 216 444 55 66")
        expect(masked.address).toBe("Sanayi Mah. Teknik Sok. No:7 Ümraniye/İstanbul")
        expect(masked.contactName).toBe("Z***a")
        expect(masked.notes).toBe("Vadeli ödeme anlaşması var")
    })

    it("USER should see masked contact info", () => {
        const masked = maskSupplier(sampleSupplier, "USER")
        expect(masked.email).toBe("z***a@supplier.com")
        expect(masked.phone).toBe("+90****66")
        expect(masked.contactName).toBe("Z***a")
        expect(masked.address).toBe("Sanay*****")
        expect(masked.notes).toBe("[Gizli]")
    })

    it("VIEWER should see maximum masking", () => {
        const masked = maskSupplier(sampleSupplier, "VIEWER")
        expect(masked.email).toBe("z***a@supplier.com")
        expect(masked.phone).toBe("+90****66")
        expect(masked.contactName).toBe("Z***a")
        expect(masked.address).toBe("Sanay*****")
        expect(masked.notes).toBe("[Gizli]")
    })

    it("should handle null contactName gracefully", () => {
        const supplier = { ...sampleSupplier, contactName: null }
        const masked = maskSupplier(supplier, "VIEWER")
        expect(masked.contactName).toBeNull()
    })
})

// ─── Edge Cases ───────────────────────────────────────────────────────────

describe("masking edge cases", () => {
    it("should handle short names (1-2 chars)", () => {
        const customer = {
            ...sampleCustomer,
            firstName: "A",
            lastName: "B",
        }
        const masked = maskCustomer(customer, "USER")
        expect(masked.firstName).toBe("A***")
        expect(masked.lastName).toBe("B***")
    })

    it("should handle emails without domain gracefully", () => {
        // Uses maskCustomer internally which calls maskEmail
        const customer = {
            ...sampleCustomer,
            email: "invalid-email",
        }
        const masked = maskCustomer(customer, "USER")
        // maskEmail checks for domain: if no domain, returns "***"
        expect(masked.email).toBe("***")
    })

    it("should handle short addresses", () => {
        const customer = {
            ...sampleCustomer,
            address: "Kısa",
        }
        const masked = maskCustomer(customer, "USER")
        expect(masked.address).toBe("*****")
    })

    it("should handle empty strings", () => {
        const customer = {
            ...sampleCustomer,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
        }
        const masked = maskCustomer(customer, "USER")
        // Empty strings → falsy → returns null from maskEmail/maskPhone
        expect(masked.email).toBeNull()
        expect(masked.phone).toBeNull()
        // Empty string → falsy → maskName returns "" (empty string is not null/undefined)
        // Actually maskName checks firstName ?? null, so "" stays as "" but then
        // if (firstName) check fails, so maskedFirst stays as ""
        expect(masked.firstName).toBe("")
        expect(masked.lastName).toBe("")
    })
})
