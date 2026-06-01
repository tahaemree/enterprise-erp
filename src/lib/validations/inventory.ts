import { z } from "zod"
import { enT } from "./i18n"
import type { TFunction } from "./i18n"

export const createProductSchema = (t: TFunction) =>
    z.object({
        name: z
            .string()
            .min(2, t("minLength", { min: 2 }))
            .max(100, t("maxLength", { max: 100 })),
        description: z.string().max(500, t("maxLength", { max: 500 })).optional(),
        sku: z
            .string()
            .min(2, t("minLength", { min: 2 }))
            .max(50, t("maxLength", { max: 50 })),
        barcode: z.string().max(50).optional(),
        price: z.coerce.number().min(0, t("invalidAmount")),
        costPrice: z.coerce.number().min(0).optional(),
        quantity: z.coerce.number().min(0),
        minStock: z.coerce.number().min(0),
        maxStock: z.coerce.number().min(0).optional(),
        unit: z.string().min(1, t("required")),
        categoryId: z.string().optional(),
        supplierId: z.string().optional(),
        isActive: z.boolean(),
    })

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const productSchema = createProductSchema(enT)

export const createCategorySchema = (t: TFunction) =>
    z.object({
        name: z
            .string()
            .min(2, t("minLength", { min: 2 }))
            .max(50, t("maxLength", { max: 50 })),
        description: z.string().max(200, t("maxLength", { max: 200 })).optional(),
        slug: z
            .string()
            .min(2, t("minLength", { min: 2 }))
            .max(50, t("maxLength", { max: 50 }))
            .regex(/^[a-z0-9-]+$/, t("invalidSlug")),
        color: z.string().optional(),
        icon: z.string().optional(),
        parentId: z.string().optional(),
    })

export type CategoryFormValues = z.infer<ReturnType<typeof createCategorySchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const categorySchema = createCategorySchema(enT)

export const createSupplierSchema = (t: TFunction) =>
    z.object({
        name: z
            .string()
            .min(2, t("minLength", { min: 2 }))
            .max(100, t("maxLength", { max: 100 })),
        contactName: z.string().max(100).optional(),
        email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
        phone: z.string().max(20).optional(),
        address: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
        postalCode: z.string().max(20).optional(),
        website: z.string().url(t("invalidUrl")).optional().or(z.literal("")),
        notes: z.string().max(500).optional(),
        paymentTerms: z.string().max(100).optional(),
        isActive: z.boolean().default(true),
    })

export type SupplierFormValues = z.infer<ReturnType<typeof createSupplierSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const supplierSchema = createSupplierSchema(enT)
