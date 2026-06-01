/**
 * Shared pagination types for all list/query functions.
 * Adding optional pagination params to getXxx functions with defaults
 * that match current behavior (no pagination = get all).
 */

export interface PaginationParams {
    page?: number
    pageSize?: number
    search?: string
    type?: string
}

export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasMore: boolean
}

/**
 * Create skip/take Prisma options from pagination params.
 * If no pagination params provided, returns empty (no pagination).
 * Returns null when no pagination is needed (to skip count query).
 */
export function getPaginationArgs(
    params?: PaginationParams
): { skip?: number; take?: number } | null {
    if (params?.page == null || params?.pageSize == null) {
        return null
    }

    const page = Math.max(1, params.page)
    const pageSize = Math.min(100, Math.max(1, params.pageSize))

    return {
        skip: (page - 1) * pageSize,
        take: pageSize,
    }
}

/**
 * Create a PaginatedResult from data and pagination params.
 * When no pagination params, returns the data as a single-page result.
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    params?: PaginationParams
): PaginatedResult<T> | T[] {
    if (!params?.page) {
        return data
    }

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? (total || 10)

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
    }
}
