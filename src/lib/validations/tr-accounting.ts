import { z } from "zod"

// ==================== DÖVİZ & KUR ====================

export const currencySchema = z.object({
    code: z.string().min(2).max(5),
    name: z.string().min(1),
    symbol: z.string().min(1),
    isDefault: z.boolean().default(false),
})

export type CurrencyFormValues = z.infer<typeof currencySchema>

export const exchangeRateSchema = z.object({
    fromCurrencyId: z.string().min(1),
    toCurrencyId: z.string().min(1),
    rate: z.coerce.number().positive(),
    date: z.coerce.date(),
    source: z.string().optional(),
}).refine((data) => data.fromCurrencyId !== data.toCurrencyId, {
    message: "Source and target currencies must be different",
    path: ["toCurrencyId"],
})

export type ExchangeRateFormValues = z.infer<typeof exchangeRateSchema>

// ==================== MASRAF MERKEZİ ====================

export const costCenterSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
})

export type CostCenterFormValues = z.infer<typeof costCenterSchema>

// ==================== BANKA HESABI ====================

export const bankAccountSchema = z.object({
    bankName: z.string().min(1),
    branchName: z.string().optional(),
    branchCode: z.string().optional(),
    accountNumber: z.string().min(1),
    iban: z.string().min(1),
    accountType: z.enum(["CHECKING", "SAVINGS", "LOAN", "CREDIT_CARD", "POS", "E_WALLET"]).default("CHECKING"),
    currency: z.string().default("TRY"),
    balance: z.coerce.number().default(0),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
})

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>

// ==================== ÇEK / SENET ====================

export const checkNoteSchema = z.object({
    type: z.enum(["CHECK", "PROMISSORY_NOTE"]),
    direction: z.enum(["RECEIVED", "ISSUED"]),
    serialNumber: z.string().min(1),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    accountNumber: z.string().optional(),
    issuerName: z.string().min(1),
    issuerTaxId: z.string().optional(),
    amount: z.coerce.number().positive(),
    currency: z.string().default("TRY"),
    issueDate: z.coerce.date(),
    maturityDate: z.coerce.date(),
    status: z.enum(["IN_PORTFOLIO", "ENDORSED", "DEPOSITED", "COLLECTED", "BOUNCED", "PROTESTED", "CANCELLED", "RETURNED"]).default("IN_PORTFOLIO"),
    notes: z.string().optional(),
}).refine((data) => data.maturityDate >= data.issueDate, {
    message: "Maturity date must be after issue date",
    path: ["maturityDate"],
})

export type CheckNoteFormValues = z.infer<typeof checkNoteSchema>

// ==================== CARİ HESAP ====================

export const customerAccountSchema = z.object({
    accountCode: z.string().min(1),
    riskLimit: z.coerce.number().min(0).default(0),
    creditLimit: z.coerce.number().optional(),
    paymentTerms: z.coerce.number().int().min(0).default(30),
    notes: z.string().optional(),
})

export type CustomerAccountFormValues = z.infer<typeof customerAccountSchema>

export const supplierAccountSchema = z.object({
    accountCode: z.string().min(1),
    riskLimit: z.coerce.number().min(0).default(0),
    creditLimit: z.coerce.number().optional(),
    paymentTerms: z.coerce.number().int().min(0).default(30),
    notes: z.string().optional(),
})

export type SupplierAccountFormValues = z.infer<typeof supplierAccountSchema>

// ==================== MUHASEBE FİŞİ ====================

export const accountEntryLineSchema = z.object({
    side: z.enum(["DEBIT", "CREDIT"]),
    amount: z.coerce.number().positive(),
    description: z.string().optional(),
    costCenterId: z.string().optional(),
    customerAccountId: z.string().optional(),
    supplierAccountId: z.string().optional(),
    bankAccountId: z.string().optional(),
    checkNoteId: z.string().optional(),
})

export type AccountEntryLineFormValues = z.infer<typeof accountEntryLineSchema>

export const accountEntrySchema = z.object({
    entryType: z.enum(["DEBIT_NOTE", "CREDIT_NOTE", "OPENING", "CLOSING", "TRANSFER", "CORRECTION"]),
    description: z.string().min(1),
    entryDate: z.coerce.date(),
    lines: z.array(accountEntryLineSchema).min(2)
        .refine((lines) => {
            const debitTotal = lines.filter(l => l.side === "DEBIT").reduce((sum, l) => sum + l.amount, 0)
            const creditTotal = lines.filter(l => l.side === "CREDIT").reduce((sum, l) => sum + l.amount, 0)
            return Math.abs(debitTotal - creditTotal) < 0.01
        }, { message: "Debit and credit totals must be equal" }),
})

export type AccountEntryFormValues = z.infer<typeof accountEntrySchema>

// ==================== VERGİ TÜRÜ ====================

export const taxTypeSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    rate: z.coerce.number().min(0).max(100),
    category: z.enum(["VAT", "WITHHOLDING", "STOPAJ", "SPECIAL"]),
    description: z.string().optional(),
})

export type TaxTypeFormValues = z.infer<typeof taxTypeSchema>

// ==================== e-BELGE (e-Fatura / e-Arşiv / e-İrsaliye) ====================

export const eInvoiceSchema = z.object({
    documentType: z.enum(["INVOICE", "ARCHIVE", "DESPATCH_ADVICE"]),
    profile: z.string().optional(),
    orderId: z.string().optional(),
    receiverTaxId: z.string().min(1),
    receiverName: z.string().min(1),
    receiverEmail: z.string().email().optional().or(z.literal("")),
    grossTotal: z.coerce.number().min(0),
    vatBaseTotal: z.coerce.number().min(0),
    vatTotal: z.coerce.number().min(0),
    netTotal: z.coerce.number().min(0),
    withholdingTotal: z.coerce.number().default(0),
    currency: z.string().default("TRY"),
    exchangeRate: z.coerce.number().optional(),
    issueDate: z.coerce.date(),
    dueDate: z.coerce.date().optional(),
    notes: z.string().optional(),
})

export type EInvoiceFormValues = z.infer<typeof eInvoiceSchema>

// ==================== BA/BS ====================

export const baBsItemSchema = z.object({
    taxId: z.string().min(1),
    name: z.string().min(1),
    documentCount: z.coerce.number().int().min(1),
    totalAmount: z.coerce.number().min(0),
})

export const baBsFormSchema = z.object({
    formType: z.enum(["BA", "BS"]),
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    items: z.array(baBsItemSchema).min(1),
})

export type BaBsFormValues = z.infer<typeof baBsFormSchema>
export type BaBsFormItemValues = z.infer<typeof baBsItemSchema>

// ==================== ENFLASYON MUHASEBESİ ====================

export const inflationCoefficientSchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    coefficient: z.coerce.number().positive(),
    ppi: z.coerce.number().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
})

export type InflationCoefficientFormValues = z.infer<typeof inflationCoefficientSchema>
