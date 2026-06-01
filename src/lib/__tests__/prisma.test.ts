import { describe, it, expect } from "vitest"
import { isUniqueConstraintError, PrismaErrorCode } from "@/lib/prisma"

describe("PrismaErrorCode", () => {
    it("should have all required error codes", () => {
        expect(PrismaErrorCode.UNIQUE_CONSTRAINT).toBe("P2002")
        expect(PrismaErrorCode.FOREIGN_KEY_FAILED).toBe("P2003")
        expect(PrismaErrorCode.RECORD_NOT_FOUND).toBe("P2025")
        expect(PrismaErrorCode.DATABASE_CONNECTION).toBe("P1001")
    })
})

describe("isUniqueConstraintError", () => {
    it("should return true for a Prisma P2002 error", () => {
        const prismaError = {
            code: "P2002",
            meta: { target: ["email"] },
            message: "Unique constraint failed on email",
        }
        expect(isUniqueConstraintError(prismaError)).toBe(true)
    })

    it("should return false for other Prisma errors", () => {
        const foreignKeyError = { code: "P2003", message: "Foreign key constraint failed" }
        const notFoundError = { code: "P2025", message: "Record not found" }
        expect(isUniqueConstraintError(foreignKeyError)).toBe(false)
        expect(isUniqueConstraintError(notFoundError)).toBe(false)
    })

    it("should return false for non-object values", () => {
        expect(isUniqueConstraintError(null)).toBe(false)
        expect(isUniqueConstraintError(undefined)).toBe(false)
        expect(isUniqueConstraintError("error")).toBe(false)
        expect(isUniqueConstraintError(42)).toBe(false)
    })

    it("should return false for objects without code property", () => {
        expect(isUniqueConstraintError({ message: "Something went wrong" })).toBe(false)
        expect(isUniqueConstraintError({})).toBe(false)
    })
})
