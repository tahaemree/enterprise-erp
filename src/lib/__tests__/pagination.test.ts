/**
 * Deftra — Pagination Utility Tests
 *
 * Covers: getPaginationArgs, createPaginatedResult, edge cases.
 */

import { describe, it, expect } from "vitest"
import { getPaginationArgs, createPaginatedResult } from "@/lib/pagination"
import type { PaginatedResult } from "@/lib/pagination"

describe("getPaginationArgs", () => {
    it("should return null when no params provided", () => {
        expect(getPaginationArgs()).toBeNull()
    })

    it("should return null when page is missing", () => {
        expect(getPaginationArgs({ pageSize: 10 })).toBeNull()
    })

    it("should return null when pageSize is missing", () => {
        expect(getPaginationArgs({ page: 1 })).toBeNull()
    })

    it("should calculate correct skip/take for page 1", () => {
        const result = getPaginationArgs({ page: 1, pageSize: 10 })
        expect(result).toEqual({ skip: 0, take: 10 })
    })

    it("should calculate correct skip/take for page 3", () => {
        const result = getPaginationArgs({ page: 3, pageSize: 20 })
        expect(result).toEqual({ skip: 40, take: 20 })
    })

    it("should clamp page to minimum of 1", () => {
        const result = getPaginationArgs({ page: 0, pageSize: 10 })
        expect(result).toEqual({ skip: 0, take: 10 })
    })

    it("should clamp pageSize to minimum of 1", () => {
        const result = getPaginationArgs({ page: 1, pageSize: 0 })
        expect(result).toEqual({ skip: 0, take: 1 })
    })

    it("should clamp pageSize to maximum of 100", () => {
        const result = getPaginationArgs({ page: 1, pageSize: 200 })
        expect(result).toEqual({ skip: 0, take: 100 })
    })

    it("should handle large page numbers", () => {
        const result = getPaginationArgs({ page: 1000, pageSize: 50 })
        expect(result).toEqual({ skip: 49950, take: 50 })
    })

    it("should handle negative page numbers", () => {
        const result = getPaginationArgs({ page: -5, pageSize: 10 })
        expect(result).toEqual({ skip: 0, take: 10 })
    })
})

describe("createPaginatedResult", () => {
    const sampleData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const sampleData25 = Array.from({ length: 25 }, (_, i) => i + 1)

    it("should return raw data when no pagination params", () => {
        const result = createPaginatedResult(sampleData, sampleData.length)
        expect(result).toEqual(sampleData)
    })

    it("should return proper paginated result when params provided", () => {
        const result = createPaginatedResult(sampleData, sampleData.length, {
            page: 1,
            pageSize: 10,
        }) as PaginatedResult<number>

        expect(result).toHaveProperty("data")
        expect(result).toHaveProperty("total")
        expect(result).toHaveProperty("page")
        expect(result).toHaveProperty("pageSize")
        expect(result).toHaveProperty("totalPages")
        expect(result).toHaveProperty("hasMore")
        expect(result.data).toEqual(sampleData)
        expect(result.total).toBe(10)
        expect(result.page).toBe(1)
        expect(result.pageSize).toBe(10)
        expect(result.totalPages).toBe(1)
        expect(result.hasMore).toBe(false)
    })

    it("should calculate hasMore correctly when there are more pages", () => {
        const result = createPaginatedResult(
            sampleData25.slice(0, 10),
            25,
            { page: 1, pageSize: 10 }
        ) as PaginatedResult<number>

        expect(result.data).toHaveLength(10)
        expect(result.totalPages).toBe(3)
        expect(result.hasMore).toBe(true)
    })

    it("should correctly indicate last page has no more items", () => {
        const result = createPaginatedResult(
            sampleData25.slice(20, 25),
            25,
            { page: 3, pageSize: 10 }
        ) as PaginatedResult<number>

        expect(result.data).toHaveLength(5)
        expect(result.page).toBe(3)
        expect(result.totalPages).toBe(3)
        expect(result.hasMore).toBe(false)
    })

    it("should calculate totalPages rounding up correctly", () => {
        const data11 = Array.from({ length: 11 }, (_, i) => i + 1)
        const result = createPaginatedResult(data11, 11, {
            page: 1,
            pageSize: 10,
        }) as PaginatedResult<number>

        expect(result.totalPages).toBe(2)
        expect(result.hasMore).toBe(true)
    })

    it("should handle empty data", () => {
        const result = createPaginatedResult([], 0, {
            page: 1,
            pageSize: 10,
        }) as PaginatedResult<number>

        expect(result.data).toEqual([])
        expect(result.total).toBe(0)
        expect(result.totalPages).toBe(0)
        expect(result.hasMore).toBe(false)
    })

    it("should handle single item on page 1", () => {
        const result = createPaginatedResult([42], 1, {
            page: 1,
            pageSize: 10,
        }) as PaginatedResult<number>

        expect(result.data).toEqual([42])
        expect(result.total).toBe(1)
        expect(result.totalPages).toBe(1)
        expect(result.hasMore).toBe(false)
    })

    it("should preserve data order in paginated result", () => {
        const result = createPaginatedResult(sampleData25.slice(10, 20), 25, {
            page: 2,
            pageSize: 10,
        }) as PaginatedResult<number>

        expect(result.data).toEqual(sampleData25.slice(10, 20))
        expect(result.page).toBe(2)
    })
})

describe("integration: getPaginationArgs + createPaginatedResult", () => {
    const allData = Array.from({ length: 55 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

    it("should paginate page 1 correctly end-to-end", () => {
        const paginationArgs = getPaginationArgs({ page: 1, pageSize: 10 })
        const pageData = paginationArgs
            ? allData.slice(paginationArgs.skip!, paginationArgs.skip! + paginationArgs.take!)
            : allData
        const result = createPaginatedResult(pageData, allData.length, {
            page: 1,
            pageSize: 10,
        })
        expect(result).not.toBeInstanceOf(Array)
        if (!Array.isArray(result)) {
            expect(result.data).toHaveLength(10)
            expect(result.data[0]?.id).toBe(1)
            expect(result.data[9]?.id).toBe(10)
            expect(result.totalPages).toBe(6)
            expect(result.hasMore).toBe(true)
        }
    })

    it("should paginate last page correctly end-to-end", () => {
        const paginationArgs = getPaginationArgs({ page: 6, pageSize: 10 })
        const pageData = paginationArgs
            ? allData.slice(paginationArgs.skip!, paginationArgs.skip! + paginationArgs.take!)
            : allData
        const result = createPaginatedResult(pageData, allData.length, {
            page: 6,
            pageSize: 10,
        })
        expect(result).not.toBeInstanceOf(Array)
        if (!Array.isArray(result)) {
            expect(result.data).toHaveLength(5)
            expect(result.data[0]?.id).toBe(51)
            expect(result.data[4]?.id).toBe(55)
            expect(result.totalPages).toBe(6)
            expect(result.hasMore).toBe(false)
        }
    })
})
