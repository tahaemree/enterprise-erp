import { z } from "zod"
import { enT } from "./i18n"
import type { TFunction } from "./i18n"

export const createEmployeeSchema = (t: TFunction) =>
    z.object({
        employeeId: z.string().min(1, t("required")),
        firstName: z.string().min(1, t("required")),
        lastName: z.string().min(1, t("required")),
        email: z.string().email(t("invalidEmail")),
        phone: z.string().optional(),
        position: z.string().min(1, t("required")),
        departmentId: z.string().optional(),
        status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "SUSPENDED", "PROBATION"]),
        hireDate: z.coerce.date(),
        salary: z.coerce.number().min(0).optional(),
        salaryType: z.enum(["hourly", "monthly", "yearly"]).default("monthly"),
        employmentType: z
            .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE", "TEMPORARY"])
            .default("FULL_TIME"),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        taxId: z.string().optional(),
        notes: z.string().optional(),
    })

export type EmployeeFormData = z.infer<ReturnType<typeof createEmployeeSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const employeeSchema = createEmployeeSchema(enT)

export const createDepartmentSchema = (t: TFunction) =>
    z.object({
        name: z.string().min(1, t("required")),
        description: z.string().optional(),
        managerId: z.string().optional(),
        budget: z.coerce.number().min(0).optional(),
    })

export type DepartmentFormData = z.infer<ReturnType<typeof createDepartmentSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const departmentSchema = createDepartmentSchema(enT)

export const createLeaveRequestSchema = (t: TFunction) =>
    z.object({
        employeeId: z.string().min(1, t("required")),
        type: z.enum(["ANNUAL", "SICK", "PERSONAL", "MATERNITY", "PATERNITY", "BEREAVEMENT", "UNPAID", "COMPENSATORY", "OTHER"]),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reason: z.string().optional(),
    }).refine((data) => data.endDate >= data.startDate, {
        message: t("endDateAfterStart"),
        path: ["endDate"],
    })

export type LeaveRequestFormData = z.infer<ReturnType<typeof createLeaveRequestSchema>>

/** Pre-built schema with English error messages (for API routes & server actions) */
export const leaveRequestSchema = createLeaveRequestSchema(enT)

export const leaveRequestStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
})
