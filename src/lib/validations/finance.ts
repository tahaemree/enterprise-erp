import { z } from "zod"

export const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
})

export const invoiceSchema = z.object({
    customerId: z.string().min(1),
    invoiceNumber: z.string().min(1),
    dueDate: z.coerce.date(),
    items: z.array(invoiceItemSchema).min(1),
    notes: z.string().optional(),
    taxRate: z.coerce.number().min(0).max(100),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>

export const orderItemSchema = z.object({
    productId: z.string().min(1),
    productName: z.string().optional(),
    quantity: z.coerce.number().min(0.001),
    unitPrice: z.coerce.number().min(0),
})

export const orderSchema = z.object({
    customerId: z.string().min(1),
    orderNumber: z.string().min(1),
    status: z
        .enum(["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED", "ON_HOLD"])
        .default("PENDING"),
    items: z.array(orderItemSchema).min(1),
    total: z.coerce.number().min(0),
    notes: z.string().optional(),
})

export type OrderFormValues = z.infer<typeof orderSchema>
export type OrderItemFormValues = z.infer<typeof orderItemSchema>

export const transactionSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE", "REFUND", "TRANSFER"]),
    category: z.string().optional(),
    description: z.string().min(1),
    amount: z.coerce.number().min(0.01),
    reference: z.string().optional(),
    date: z.coerce.date(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

export const orderStatusSchema = z.object({
    status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED", "ON_HOLD"]),
})

// ─── Re-exports from tr-accounting (single source of truth) ────────────────

export {
    bankAccountSchema,
    costCenterSchema,
    checkNoteSchema,
    type BankAccountFormValues,
    type CostCenterFormValues,
    type CheckNoteFormValues,
} from "./tr-accounting"


