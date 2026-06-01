import { z } from "zod"
import { enT } from "./i18n"
import type { TFunction } from "./i18n"

export const createCustomerSchema = (t: TFunction) =>
    z.object({
        firstName: z
            .string()
            .min(1, t("required"))
            .max(50, t("maxLength", { max: 50 })),
        lastName: z
            .string()
            .min(1, t("required"))
            .max(50, t("maxLength", { max: 50 })),
        email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
        phone: z.string().max(20, t("maxLength", { max: 20 })).optional(),
        company: z.string().max(100, t("maxLength", { max: 100 })).optional(),
        jobTitle: z.string().max(100, t("maxLength", { max: 100 })).optional(),
        address: z.string().max(200, t("maxLength", { max: 200 })).optional(),
        city: z.string().max(100, t("maxLength", { max: 100 })).optional(),
        state: z.string().max(100, t("maxLength", { max: 100 })).optional(),
        country: z.string().max(100, t("maxLength", { max: 100 })).optional(),
        postalCode: z.string().max(20, t("maxLength", { max: 20 })).optional(),
        notes: z.string().max(1000, t("maxLength", { max: 1000 })).optional(),
        source: z
            .enum(["DIRECT", "REFERRAL", "WEBSITE", "SOCIAL_MEDIA", "ADVERTISEMENT", "COLD_CALL", "TRADE_SHOW", "OTHER"])
            .default("DIRECT"),
        status: z
            .enum(["LEAD", "QUALIFIED", "OPPORTUNITY", "PROPOSAL", "NEGOTIATION", "CUSTOMER", "CHURNED"])
            .default("LEAD"),
        tags: z.array(z.string()).default([]),
    })

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const customerSchema = createCustomerSchema(enT)

export const createInteractionSchema = (t: TFunction) =>
    z.object({
        type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "DEMO", "FOLLOW_UP", "OTHER"]),
        subject: z
            .string()
            .min(1, t("required"))
            .max(200, t("maxLength", { max: 200 })),
        description: z.string().max(2000, t("maxLength", { max: 2000 })).optional(),
        date: z.coerce.date(),
        duration: z.number().min(0).optional(),
        outcome: z.string().max(500, t("maxLength", { max: 500 })).optional(),
        nextAction: z.string().max(500, t("maxLength", { max: 500 })).optional(),
        nextDate: z.coerce.date().optional(),
        customerId: z.string().min(1, t("selectRequired")),
    })

export type InteractionFormValues = z.infer<ReturnType<typeof createInteractionSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const interactionSchema = createInteractionSchema(enT)
