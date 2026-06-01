import { describe, it, expect } from "vitest"
import { employeeSchema, departmentSchema, leaveRequestSchema } from "@/lib/validations/hr"

describe("employeeSchema", () => {
    it("should validate a valid employee", () => {
        const result = employeeSchema.safeParse({
            employeeId: "EMP-001",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@company.com",
            position: "Developer",
            departmentId: "dept-1",
            status: "ACTIVE",
            hireDate: new Date("2024-01-01"),
        })
        expect(result.success).toBe(true)
    })

    it("should reject missing required fields", () => {
        const result = employeeSchema.safeParse({ firstName: "Jane" })
        expect(result.success).toBe(false)
    })

    it("should reject invalid email", () => {
        const result = employeeSchema.safeParse({
            firstName: "Jane",
            lastName: "Smith",
            email: "bad-email",
            position: "Dev",
            departmentId: "dept-1",
            status: "ACTIVE",
            hireDate: new Date(),
        })
        expect(result.success).toBe(false)
    })

    it("should reject invalid status enum", () => {
        const result = employeeSchema.safeParse({
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@company.com",
            position: "Dev",
            departmentId: "dept-1",
            status: "UNKNOWN",
            hireDate: new Date(),
        })
        expect(result.success).toBe(false)
    })
})

describe("departmentSchema", () => {
    it("should validate a valid department", () => {
        const result = departmentSchema.safeParse({
            name: "Engineering",
            description: "Tech team",
            budget: 500000,
        })
        expect(result.success).toBe(true)
    })

    it("should reject missing name", () => {
        const result = departmentSchema.safeParse({})
        expect(result.success).toBe(false)
    })
})

describe("leaveRequestSchema", () => {
    it("should validate a valid leave request", () => {
        const result = leaveRequestSchema.safeParse({
            employeeId: "emp-1",
            type: "ANNUAL",
            startDate: new Date("2025-01-10"),
            endDate: new Date("2025-01-15"),
        })
        expect(result.success).toBe(true)
    })

    it("should reject end date before start date", () => {
        const result = leaveRequestSchema.safeParse({
            employeeId: "emp-1",
            type: "SICK",
            startDate: new Date("2025-01-15"),
            endDate: new Date("2025-01-10"),
        })
        expect(result.success).toBe(false)
    })

    it("should reject missing required fields", () => {
        const result = leaveRequestSchema.safeParse({ type: "ANNUAL" })
        expect(result.success).toBe(false)
    })
})
