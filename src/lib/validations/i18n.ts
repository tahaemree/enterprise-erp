/**
 * Shared validation i18n utility.
 *
 * Each validations/*.ts module defines its own `enT` fallback for
 * server-action / API-route usage where no request locale is available.
 *
 * This consolidates *all* fallback messages into one place so they
 * stay consistent across modules AND can be replaced later with a
 * proper next-intl `getTranslations()` call.
 *
 * Usage in server actions (current):
 *   import { enT } from "./i18n"
 *   const schema = createProductSchema(enT)
 *
 * Future i18n-ready usage (when locale is available):
 *   import { getTranslations } from "next-intl/server"
 *   const t = await getTranslations("validations")
 *   const schema = createProductSchema(t)
 */

export type TFunction = (
    key: string,
    params?: Record<string, string | number>
) => string

/**
 * English fallback translation function.
 * Used when no request locale context is available
 * (API routes, server actions, tests).
 */
export const enT: TFunction = (key, params) => {
    const msgs: Record<string, string | ((p?: Record<string, string | number>) => string)> = {
        // ── Generic ──────────────────────────────────────────
        required: "This field is required",
        invalidValue: "Invalid value",
        invalidEmail: "Invalid email address",
        invalidDate: "Invalid date",
        invalidUrl: "Invalid URL",
        invalidSlug: "Only lowercase letters, numbers, and hyphens allowed",
        invalidAmount: "Amount must be at least 0",
        selectRequired: "Please select an option",

        // ── Length ───────────────────────────────────────────
        minLength: (p) =>
            p ? `Must be at least ${p["min"]} characters` : "Too short",
        maxLength: (p) =>
            p ? `Must be at most ${p["max"]} characters` : "Too long",

        // ── Date ─────────────────────────────────────────────
        endDateAfterStart: "End date must be after start date",

        // ── Number ───────────────────────────────────────────
        positive: "Value must be positive",
        minValue: (p) =>
            p ? `Must be at least ${p["min"]}` : "Value too low",
        maxValue: (p) =>
            p ? `Must be at most ${p["max"]}` : "Value too high",

        // ── Finance / Accounting ─────────────────────────────
        currencyRequired: "Currency is required",
        exchangeRatePositive: "Exchange rate must be positive",
        currenciesMustDiffer: "Source and target currencies must be different",
        bankNameRequired: "Bank name is required",
        accountNumberRequired: "Account number is required",
        ibanRequired: "IBAN is required",
        serialNumberRequired: "Serial number is required",
        issuerNameRequired: "Issuer name is required",
        amountPositive: "Amount must be positive",
        maturityAfterIssue: "Maturity date must be after issue date",
        riskLimitMin: "Risk limit must be 0 or greater",
        accountCodeRequired: "Account code is required",
        descriptionRequired: "Description is required",
        atLeastTwoLines: "At least 2 lines required (debit & credit)",
        debitCreditEqual: "Debit and credit totals must be equal",
        taxCodeRequired: "Tax code is required",
        taxNameRequired: "Tax name is required",
        taxRateRange: "Tax rate must be between 0 and 100",
        receiverTaxIdRequired: "Receiver tax ID is required",
        receiverNameRequired: "Receiver name is required",
        documentCountMin: "Document count must be at least 1",
        totalAmountMin: "Total amount must be 0 or greater",
        atLeastOneItem: "At least one item is required",
        coefficientPositive: "Coefficient must be positive",

        // ── Inventory ────────────────────────────────────────
        productNameRequired: "Product name is required",
        skuRequired: "SKU is required",
        quantityMin: "Quantity must be at least 1",
        priceMin: "Price must be at least 0",

        // ── CRM ──────────────────────────────────────────────
        customerNameRequired: "Customer name is required",
        subjectRequired: "Subject is required",

        // ── HR ────────────────────────────────────────────────
        employeeIdRequired: "Employee ID is required",
        positionRequired: "Position is required",
    }

    const entry = msgs[key]
    if (typeof entry === "function") {
        return entry(params)
    }
    return entry ?? "Invalid value"
}
