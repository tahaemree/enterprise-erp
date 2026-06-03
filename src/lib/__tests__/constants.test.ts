/**
 * Deftra — Constants Testleri
 *
 * Covers: enum değerleri, type'lar, label/color map'leri,
 * pagination varsayılanları, rate limit config, path'ler.
 */

import { describe, it, expect } from "vitest"
import {
    ROLES,
    ROLE_HIERARCHY,
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
    PAYMENT_STATUS,
    EMPLOYEE_STATUS,
    EMPLOYEE_STATUS_LABELS,
    LEAVE_STATUS,
    LEAVE_TYPE,
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    CUSTOMER_STATUS,
    CUSTOMER_SOURCE,
    STOCK_STATUS,
    EMPLOYMENT_TYPE,
    EINVOICE_STATUS,
    DOCUMENT_TYPE,
    ENTITY_TYPE,
    ENTITY_TYPE_LABELS,
    LOG_ACTION,
    LOG_ACTION_LABELS,
    PAGINATION,
    CACHE_TAGS,
    RATE_LIMIT,
    CURRENCY_CODE,
    CURRENCY_SYMBOLS,
    PATHS,
    MODULE,
} from "@/lib/constants"

describe("ROLES", () => {
    it("should have 4 roles with correct values", () => {
        expect(ROLES.ADMIN).toBe("ADMIN")
        expect(ROLES.MANAGER).toBe("MANAGER")
        expect(ROLES.USER).toBe("USER")
        expect(ROLES.VIEWER).toBe("VIEWER")
        expect(Object.keys(ROLES)).toHaveLength(4)
    })
})

describe("ROLE_HIERARCHY", () => {
    it("should define correct hierarchy levels", () => {
        expect(ROLE_HIERARCHY[ROLES.ADMIN]).toBe(100)
        expect(ROLE_HIERARCHY[ROLES.MANAGER]).toBe(50)
        expect(ROLE_HIERARCHY[ROLES.USER]).toBe(10)
        expect(ROLE_HIERARCHY[ROLES.VIEWER]).toBe(1)
    })

    it("should have ADMIN > MANAGER > USER > VIEWER", () => {
        expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MANAGER)
        expect(ROLE_HIERARCHY.MANAGER).toBeGreaterThan(ROLE_HIERARCHY.USER)
        expect(ROLE_HIERARCHY.USER).toBeGreaterThan(ROLE_HIERARCHY.VIEWER)
    })
})

describe("ORDER_STATUS", () => {
    it("should have 10 status values", () => {
        expect(Object.keys(ORDER_STATUS)).toHaveLength(10)
    })

    it("should have matching labels for all statuses", () => {
        for (const key of Object.keys(ORDER_STATUS)) {
            const status = ORDER_STATUS[key as keyof typeof ORDER_STATUS]
            expect(ORDER_STATUS_LABELS[status]).toBeDefined()
            expect(ORDER_STATUS_COLORS[status]).toBeDefined()
        }
    })

    it("labels should be non-empty strings", () => {
        for (const label of Object.values(ORDER_STATUS_LABELS)) {
            expect(label.length).toBeGreaterThan(0)
        }
    })
})

describe("PAYMENT_STATUS", () => {
    it("should have 5 status values", () => {
        expect(Object.keys(PAYMENT_STATUS)).toHaveLength(5)
    })

    it("should include unpaid and paid", () => {
        expect(PAYMENT_STATUS.UNPAID).toBe("unpaid")
        expect(PAYMENT_STATUS.PAID).toBe("paid")
    })
})

describe("EMPLOYEE_STATUS", () => {
    it("should have 5 status values with labels", () => {
        expect(Object.keys(EMPLOYEE_STATUS)).toHaveLength(5)
        for (const key of Object.keys(EMPLOYEE_STATUS)) {
            const status = EMPLOYEE_STATUS[key as keyof typeof EMPLOYEE_STATUS]
            expect(EMPLOYEE_STATUS_LABELS[status]).toBeDefined()
        }
    })
})

describe("LEAVE_STATUS", () => {
    it("should have 5 status values", () => {
        expect(Object.keys(LEAVE_STATUS)).toHaveLength(5)
    })

    it("should include all required statuses", () => {
        expect(LEAVE_STATUS.PENDING).toBe("PENDING")
        expect(LEAVE_STATUS.APPROVED).toBe("APPROVED")
        expect(LEAVE_STATUS.REJECTED).toBe("REJECTED")
        expect(LEAVE_STATUS.CANCELLED).toBe("CANCELLED")
        expect(LEAVE_STATUS.IN_PROGRESS).toBe("IN_PROGRESS")
    })
})

describe("LEAVE_TYPE", () => {
    it("should have 9 leave types", () => {
        expect(Object.keys(LEAVE_TYPE)).toHaveLength(9)
    })

    it("should include common types", () => {
        expect(LEAVE_TYPE.ANNUAL).toBe("ANNUAL")
        expect(LEAVE_TYPE.SICK).toBe("SICK")
        expect(LEAVE_TYPE.MATERNITY).toBe("MATERNITY")
    })
})

describe("TRANSACTION_TYPE", () => {
    it("should have 4 transaction types", () => {
        expect(Object.keys(TRANSACTION_TYPE)).toHaveLength(4)
    })

    it("should include INCOME and EXPENSE", () => {
        expect(TRANSACTION_TYPE.INCOME).toBe("INCOME")
        expect(TRANSACTION_TYPE.EXPENSE).toBe("EXPENSE")
    })
})

describe("TRANSACTION_STATUS", () => {
    it("should have 4 status values", () => {
        expect(Object.keys(TRANSACTION_STATUS)).toHaveLength(4)
    })
})

describe("CUSTOMER_STATUS", () => {
    it("should have 7 status values forming a pipeline", () => {
        expect(Object.keys(CUSTOMER_STATUS)).toHaveLength(7)
        expect(CUSTOMER_STATUS.LEAD).toBe("LEAD")
        expect(CUSTOMER_STATUS.CUSTOMER).toBe("CUSTOMER")
        expect(CUSTOMER_STATUS.CHURNED).toBe("CHURNED")
    })
})

describe("CUSTOMER_SOURCE", () => {
    it("should have 8 source values", () => {
        expect(Object.keys(CUSTOMER_SOURCE)).toHaveLength(8)
        expect(CUSTOMER_SOURCE.DIRECT).toBe("DIRECT")
        expect(CUSTOMER_SOURCE.REFERRAL).toBe("REFERRAL")
    })
})

describe("STOCK_STATUS", () => {
    it("should have 3 stock statuses", () => {
        expect(Object.keys(STOCK_STATUS)).toHaveLength(3)
        expect(STOCK_STATUS.IN_STOCK).toBe("in-stock")
        expect(STOCK_STATUS.LOW_STOCK).toBe("low-stock")
        expect(STOCK_STATUS.OUT_OF_STOCK).toBe("out-of-stock")
    })
})

describe("EMPLOYMENT_TYPE", () => {
    it("should have 6 employment types", () => {
        expect(Object.keys(EMPLOYMENT_TYPE)).toHaveLength(6)
        expect(EMPLOYMENT_TYPE.FULL_TIME).toBe("FULL_TIME")
        expect(EMPLOYMENT_TYPE.CONTRACT).toBe("CONTRACT")
    })
})

describe("EINVOICE_STATUS", () => {
    it("should have 10 status values", () => {
        expect(Object.keys(EINVOICE_STATUS)).toHaveLength(10)
    })

    it("should include GIB-specific statuses", () => {
        expect(EINVOICE_STATUS.SENT_TO_GIB).toBe("SENT_TO_GIB")
        expect(EINVOICE_STATUS.GIB_ACCEPTED).toBe("GIB_ACCEPTED")
        expect(EINVOICE_STATUS.GIB_REJECTED).toBe("GIB_REJECTED")
    })
})

describe("DOCUMENT_TYPE", () => {
    it("should have 4 document types", () => {
        expect(Object.keys(DOCUMENT_TYPE)).toHaveLength(4)
        expect(DOCUMENT_TYPE.INVOICE).toBe("INVOICE")
        expect(DOCUMENT_TYPE.ARCHIVE).toBe("ARCHIVE")
        expect(DOCUMENT_TYPE.LEDGER).toBe("LEDGER")
    })
})

describe("ENTITY_TYPE", () => {
    it("should have 21 entity types", () => {
        expect(Object.keys(ENTITY_TYPE)).toHaveLength(21)
    })

    it("should have labels for all entities", () => {
        for (const key of Object.keys(ENTITY_TYPE)) {
            const entity = ENTITY_TYPE[key as keyof typeof ENTITY_TYPE]
            expect(ENTITY_TYPE_LABELS[entity]).toBeDefined()
        }
    })

    it("should include core business entities", () => {
        expect(ENTITY_TYPE.PRODUCT).toBe("PRODUCT")
        expect(ENTITY_TYPE.CUSTOMER).toBe("CUSTOMER")
        expect(ENTITY_TYPE.ORDER).toBe("ORDER")
        expect(ENTITY_TYPE.EMPLOYEE).toBe("EMPLOYEE")
    })
})

describe("LOG_ACTION", () => {
    it("should have 10 log actions", () => {
        expect(Object.keys(LOG_ACTION)).toHaveLength(10)
    })

    it("should have labels for all actions", () => {
        for (const key of Object.keys(LOG_ACTION)) {
            const action = LOG_ACTION[key as keyof typeof LOG_ACTION]
            expect(LOG_ACTION_LABELS[action]).toBeDefined()
        }
    })

    it("should include CRUD actions", () => {
        expect(LOG_ACTION.CREATE).toBe("CREATE")
        expect(LOG_ACTION.UPDATE).toBe("UPDATE")
        expect(LOG_ACTION.DELETE).toBe("DELETE")
        expect(LOG_ACTION.LOGIN).toBe("LOGIN")
    })
})

describe("PAGINATION", () => {
    it("should have sensible defaults", () => {
        expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(10)
        expect(PAGINATION.MAX_PAGE_SIZE).toBe(100)
        expect(PAGINATION.DEFAULT_PAGE).toBe(1)
    })

    it("max should be greater than default", () => {
        expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThan(PAGINATION.DEFAULT_PAGE_SIZE)
    })
})

describe("CACHE_TAGS", () => {
    it("should have 9 cache tags", () => {
        expect(Object.keys(CACHE_TAGS)).toHaveLength(9)
    })

    it("should include dashboard and module tags", () => {
        expect(CACHE_TAGS.DASHBOARD).toBe("dashboard")
        expect(CACHE_TAGS.PRODUCTS).toBe("products")
        expect(CACHE_TAGS.ORDERS).toBe("orders")
    })
})

describe("RATE_LIMIT", () => {
    it("should have rate limit configs for login and API", () => {
        expect(RATE_LIMIT.LOGIN.limit).toBe(5)
        expect(RATE_LIMIT.LOGIN.windowMs).toBe(15 * 60 * 1000)
        expect(RATE_LIMIT.API.limit).toBe(100)
        expect(RATE_LIMIT.API.windowMs).toBe(60 * 1000)
        expect(RATE_LIMIT.AUTH.limit).toBe(20)
    })
})

describe("CURRENCY_CODE", () => {
    it("should have 6 currencies", () => {
        expect(Object.keys(CURRENCY_CODE)).toHaveLength(6)
    })

    it("should include TRY, USD, EUR", () => {
        expect(CURRENCY_CODE.TRY).toBe("TRY")
        expect(CURRENCY_CODE.USD).toBe("USD")
        expect(CURRENCY_CODE.EUR).toBe("EUR")
    })

    it("should have symbols for all currencies", () => {
        for (const key of Object.keys(CURRENCY_CODE)) {
            const code = CURRENCY_CODE[key as keyof typeof CURRENCY_CODE]
            expect(CURRENCY_SYMBOLS[code]).toBeDefined()
        }
    })

    it("should use correct symbols", () => {
        expect(CURRENCY_SYMBOLS.TRY).toBe("₺")
        expect(CURRENCY_SYMBOLS.USD).toBe("$")
        expect(CURRENCY_SYMBOLS.EUR).toBe("€")
    })
})

describe("PATHS", () => {
    it("should have 25 route paths", () => {
        expect(Object.keys(PATHS)).toHaveLength(25)
    })

    it("should all start with /", () => {
        for (const path of Object.values(PATHS)) {
            expect(path.startsWith("/")).toBe(true)
        }
    })

    it("should include all module paths", () => {
        expect(PATHS.PRODUCTS).toBe("/inventory/products")
        expect(PATHS.CUSTOMERS).toBe("/crm/customers")
        expect(PATHS.ORDERS).toBe("/finance/orders")
        expect(PATHS.EMPLOYEES).toBe("/hr/employees")
        expect(PATHS.EINVOICE).toBe("/accounting/e-invoice")
    })
})

describe("MODULE", () => {
    it("should have 20 module names", () => {
        expect(Object.keys(MODULE)).toHaveLength(20)
    })

    it("should use kebab-case", () => {
        for (const moduleName of Object.values(MODULE)) {
            expect(moduleName).not.toContain("_")
            expect(moduleName).not.toContain(" ")
            expect(moduleName).toBe(moduleName.toLowerCase())
        }
    })

    it("should include all action modules", () => {
        expect(MODULE.PRODUCTS).toBe("products")
        expect(MODULE.AUTH).toBe("auth")
        expect(MODULE.DASHBOARD).toBe("dashboard")
    })
})
