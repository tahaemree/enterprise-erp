/**
 * Deftra — Centralized Constants & Enums
 *
 * Single source of truth for all status values, role names,
 * entity types, and other constants used across the application.
 * Eliminates magic strings and hardcoded values.
 *
 * Environment-dependent defaults (pagination, rate limits, cache TTLs)
 * should be configured via environment variables. See @/lib/config for the
 * env-based configuration that mirrors these defaults at runtime.
 */

import { config } from "@/lib/config"

// ─── User Roles ───────────────────────────────────────────────────────────

export const ROLES = {
    ADMIN: "ADMIN" as const,
    MANAGER: "MANAGER" as const,
    USER: "USER" as const,
    VIEWER: "VIEWER" as const,
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
    [ROLES.ADMIN]: 100,
    [ROLES.MANAGER]: 50,
    [ROLES.USER]: 10,
    [ROLES.VIEWER]: 1,
}

// ─── Order Status ─────────────────────────────────────────────────────────

export const ORDER_STATUS = {
    DRAFT: "DRAFT" as const,
    PENDING: "PENDING" as const,
    CONFIRMED: "CONFIRMED" as const,
    PROCESSING: "PROCESSING" as const,
    SHIPPED: "SHIPPED" as const,
    DELIVERED: "DELIVERED" as const,
    COMPLETED: "COMPLETED" as const,
    CANCELLED: "CANCELLED" as const,
    REFUNDED: "REFUNDED" as const,
    ON_HOLD: "ON_HOLD" as const,
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    [ORDER_STATUS.DRAFT]: "Draft",
    [ORDER_STATUS.PENDING]: "Pending",
    [ORDER_STATUS.CONFIRMED]: "Confirmed",
    [ORDER_STATUS.PROCESSING]: "Processing",
    [ORDER_STATUS.SHIPPED]: "Shipped",
    [ORDER_STATUS.DELIVERED]: "Delivered",
    [ORDER_STATUS.COMPLETED]: "Completed",
    [ORDER_STATUS.CANCELLED]: "Cancelled",
    [ORDER_STATUS.REFUNDED]: "Refunded",
    [ORDER_STATUS.ON_HOLD]: "On Hold",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    [ORDER_STATUS.DRAFT]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    [ORDER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    [ORDER_STATUS.CONFIRMED]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    [ORDER_STATUS.PROCESSING]: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    [ORDER_STATUS.SHIPPED]: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    [ORDER_STATUS.COMPLETED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    [ORDER_STATUS.REFUNDED]: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    [ORDER_STATUS.ON_HOLD]: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
}

// ─── Payment Status ──────────────────────────────────────────────────────

export const PAYMENT_STATUS = {
    UNPAID: "unpaid" as const,
    PARTIAL: "partial" as const,
    PAID: "paid" as const,
    REFUNDED: "refunded" as const,
    OVERDUE: "overdue" as const,
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

// ─── Employee Status ─────────────────────────────────────────────────────

export const EMPLOYEE_STATUS = {
    ACTIVE: "ACTIVE" as const,
    ON_LEAVE: "ON_LEAVE" as const,
    TERMINATED: "TERMINATED" as const,
    SUSPENDED: "SUSPENDED" as const,
    PROBATION: "PROBATION" as const,
} as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS]

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
    [EMPLOYEE_STATUS.ACTIVE]: "Active",
    [EMPLOYEE_STATUS.ON_LEAVE]: "On Leave",
    [EMPLOYEE_STATUS.TERMINATED]: "Terminated",
    [EMPLOYEE_STATUS.SUSPENDED]: "Suspended",
    [EMPLOYEE_STATUS.PROBATION]: "Probation",
}

// ─── Leave Status ────────────────────────────────────────────────────────

export const LEAVE_STATUS = {
    PENDING: "PENDING" as const,
    APPROVED: "APPROVED" as const,
    REJECTED: "REJECTED" as const,
    CANCELLED: "CANCELLED" as const,
    IN_PROGRESS: "IN_PROGRESS" as const,
} as const

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS]

// ─── Leave Type ──────────────────────────────────────────────────────────

export const LEAVE_TYPE = {
    ANNUAL: "ANNUAL" as const,
    SICK: "SICK" as const,
    PERSONAL: "PERSONAL" as const,
    MATERNITY: "MATERNITY" as const,
    PATERNITY: "PATERNITY" as const,
    BEREAVEMENT: "BEREAVEMENT" as const,
    UNPAID: "UNPAID" as const,
    COMPENSATORY: "COMPENSATORY" as const,
    OTHER: "OTHER" as const,
} as const

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE]

// ─── Transaction Type ────────────────────────────────────────────────────

export const TRANSACTION_TYPE = {
    INCOME: "INCOME" as const,
    EXPENSE: "EXPENSE" as const,
    REFUND: "REFUND" as const,
    TRANSFER: "TRANSFER" as const,
} as const

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE]

// ─── Transaction Status ──────────────────────────────────────────────────

export const TRANSACTION_STATUS = {
    PENDING: "PENDING" as const,
    COMPLETED: "COMPLETED" as const,
    FAILED: "FAILED" as const,
    CANCELLED: "CANCELLED" as const,
} as const

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS]

// ─── Customer Status ─────────────────────────────────────────────────────

export const CUSTOMER_STATUS = {
    LEAD: "LEAD" as const,
    QUALIFIED: "QUALIFIED" as const,
    OPPORTUNITY: "OPPORTUNITY" as const,
    PROPOSAL: "PROPOSAL" as const,
    NEGOTIATION: "NEGOTIATION" as const,
    CUSTOMER: "CUSTOMER" as const,
    CHURNED: "CHURNED" as const,
} as const

export type CustomerStatus = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS]

// ─── Customer Source ─────────────────────────────────────────────────────

export const CUSTOMER_SOURCE = {
    DIRECT: "DIRECT" as const,
    REFERRAL: "REFERRAL" as const,
    WEBSITE: "WEBSITE" as const,
    SOCIAL_MEDIA: "SOCIAL_MEDIA" as const,
    ADVERTISEMENT: "ADVERTISEMENT" as const,
    COLD_CALL: "COLD_CALL" as const,
    TRADE_SHOW: "TRADE_SHOW" as const,
    OTHER: "OTHER" as const,
} as const

export type CustomerSource = (typeof CUSTOMER_SOURCE)[keyof typeof CUSTOMER_SOURCE]

// ─── Stock Status ────────────────────────────────────────────────────────

export const STOCK_STATUS = {
    IN_STOCK: "in-stock" as const,
    LOW_STOCK: "low-stock" as const,
    OUT_OF_STOCK: "out-of-stock" as const,
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

// ─── Employment Type ─────────────────────────────────────────────────────

export const EMPLOYMENT_TYPE = {
    FULL_TIME: "FULL_TIME" as const,
    PART_TIME: "PART_TIME" as const,
    CONTRACT: "CONTRACT" as const,
    INTERN: "INTERN" as const,
    FREELANCE: "FREELANCE" as const,
    TEMPORARY: "TEMPORARY" as const,
} as const

export type EmploymentType = (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE]

// ─── E-Invoice Status ────────────────────────────────────────────────────

export const EINVOICE_STATUS = {
    DRAFT: "DRAFT" as const,
    PENDING_SIGN: "PENDING_SIGN" as const,
    SIGNED: "SIGNED" as const,
    SENDING: "SENDING" as const,
    SENT_TO_GIB: "SENT_TO_GIB" as const,
    GIB_ACCEPTED: "GIB_ACCEPTED" as const,
    GIB_REJECTED: "GIB_REJECTED" as const,
    GIB_WARNING: "GIB_WARNING" as const,
    CANCELLED: "CANCELLED" as const,
    ERROR: "ERROR" as const,
} as const

export type EInvoiceStatus = (typeof EINVOICE_STATUS)[keyof typeof EINVOICE_STATUS]

// ─── Document Type ───────────────────────────────────────────────────────

export const DOCUMENT_TYPE = {
    INVOICE: "INVOICE" as const,
    ARCHIVE: "ARCHIVE" as const,
    DESPATCH_ADVICE: "DESPATCH_ADVICE" as const,
    LEDGER: "LEDGER" as const,
} as const

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE]

// ─── Entity Types (for Activity Log) ─────────────────────────────────────

export const ENTITY_TYPE = {
    PRODUCT: "PRODUCT" as const,
    CATEGORY: "CATEGORY" as const,
    SUPPLIER: "SUPPLIER" as const,
    CUSTOMER: "CUSTOMER" as const,
    ORDER: "ORDER" as const,
    INVOICE: "INVOICE" as const,
    TRANSACTION: "TRANSACTION" as const,
    BANK_ACCOUNT: "BANK_ACCOUNT" as const,
    CHECK_NOTE: "CHECK_NOTE" as const,
    COST_CENTER: "COST_CENTER" as const,
    ACCOUNT_ENTRY: "ACCOUNT_ENTRY" as const,
    EMPLOYEE: "EMPLOYEE" as const,
    DEPARTMENT: "DEPARTMENT" as const,
    LEAVE_REQUEST: "LEAVE_REQUEST" as const,
    TAX_TYPE: "TAX_TYPE" as const,
    EXCHANGE_RATE: "EXCHANGE_RATE" as const,
    CURRENCY: "CURRENCY" as const,
    EINVOICE: "EINVOICE" as const,
    BA_BS_FORM: "BA_BS_FORM" as const,
    USER: "USER" as const,
    SETTING: "SETTING" as const,
} as const

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE]

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
    [ENTITY_TYPE.PRODUCT]: "product",
    [ENTITY_TYPE.CATEGORY]: "category",
    [ENTITY_TYPE.SUPPLIER]: "supplier",
    [ENTITY_TYPE.CUSTOMER]: "customer",
    [ENTITY_TYPE.ORDER]: "order",
    [ENTITY_TYPE.INVOICE]: "invoice",
    [ENTITY_TYPE.TRANSACTION]: "payment",
    [ENTITY_TYPE.BANK_ACCOUNT]: "bank_account",
    [ENTITY_TYPE.CHECK_NOTE]: "check_note",
    [ENTITY_TYPE.COST_CENTER]: "cost_center",
    [ENTITY_TYPE.ACCOUNT_ENTRY]: "account_entry",
    [ENTITY_TYPE.EMPLOYEE]: "employee",
    [ENTITY_TYPE.DEPARTMENT]: "department",
    [ENTITY_TYPE.LEAVE_REQUEST]: "leave",
    [ENTITY_TYPE.TAX_TYPE]: "tax_type",
    [ENTITY_TYPE.EXCHANGE_RATE]: "exchange_rate",
    [ENTITY_TYPE.CURRENCY]: "currency",
    [ENTITY_TYPE.EINVOICE]: "einvoice",
    [ENTITY_TYPE.BA_BS_FORM]: "ba_bs_form",
    [ENTITY_TYPE.USER]: "user",
    [ENTITY_TYPE.SETTING]: "setting",
}

// ─── Log Actions ─────────────────────────────────────────────────────────

export const LOG_ACTION = {
    CREATE: "CREATE" as const,
    UPDATE: "UPDATE" as const,
    DELETE: "DELETE" as const,
    APPROVE: "APPROVE" as const,
    REJECT: "REJECT" as const,
    SUBMIT: "SUBMIT" as const,
    CANCEL: "CANCEL" as const,
    SEND: "SEND" as const,
    LOGIN: "LOGIN" as const,
    LOGOUT: "LOGOUT" as const,
} as const

export type LogAction = (typeof LOG_ACTION)[keyof typeof LOG_ACTION]

export const LOG_ACTION_LABELS: Record<LogAction, string> = {
    [LOG_ACTION.CREATE]: "created",
    [LOG_ACTION.UPDATE]: "updated",
    [LOG_ACTION.DELETE]: "deleted",
    [LOG_ACTION.APPROVE]: "approved",
    [LOG_ACTION.REJECT]: "rejected",
    [LOG_ACTION.SUBMIT]: "submitted",
    [LOG_ACTION.CANCEL]: "cancelled",
    [LOG_ACTION.SEND]: "sent",
    [LOG_ACTION.LOGIN]: "login",
    [LOG_ACTION.LOGOUT]: "logout",
}

// ─── Pagination Defaults ─────────────────────────────────────────────────
//
// Values are derived from @/lib/config (env-based by default).
// Override via: DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE env vars.
// Note: as const is omitted intentionally — values are dynamic from config.

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: config.pagination.defaultPageSize,
    MAX_PAGE_SIZE: config.pagination.maxPageSize,
    DEFAULT_PAGE: 1,
}

// ─── Cache Tags ──────────────────────────────────────────────────────────

export const CACHE_TAGS = {
    DASHBOARD: "dashboard" as const,
    REVENUE: "revenue" as const,
    EXPENSES: "expenses" as const,
    KPIS: "kpis" as const,
    PRODUCTS: "products" as const,
    ORDERS: "orders" as const,
    CUSTOMERS: "customers" as const,
    EMPLOYEES: "employees" as const,
    INVENTORY: "inventory" as const,
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

// ─── Rate Limiting ───────────────────────────────────────────────────────
//
// Login/API limits are derived from @/lib/config (env-based by default).
// Override via: LOGIN_MAX_ATTEMPTS, API_RATE_LIMIT env vars.

export const RATE_LIMIT = {
    LOGIN: { limit: config.rateLimit.login.limit, windowMs: config.rateLimit.login.windowMs },
    API: { limit: config.rateLimit.api.limit, windowMs: config.rateLimit.api.windowMs },
    AUTH: { limit: 20, windowMs: 60 * 1000 },
}

// ─── Currencies ──────────────────────────────────────────────────────────

export const CURRENCY_CODE = {
    TRY: "TRY" as const,
    USD: "USD" as const,
    EUR: "EUR" as const,
    GBP: "GBP" as const,
    CHF: "CHF" as const,
    JPY: "JPY" as const,
} as const

export type CurrencyCode = (typeof CURRENCY_CODE)[keyof typeof CURRENCY_CODE]

export const CURRENCY_SYMBOLS: Record<string, string> = {
    [CURRENCY_CODE.TRY]: "₺",
    [CURRENCY_CODE.USD]: "$",
    [CURRENCY_CODE.EUR]: "€",
    [CURRENCY_CODE.GBP]: "£",
    [CURRENCY_CODE.CHF]: "CHF",
    [CURRENCY_CODE.JPY]: "¥",
    RUB: "₽",
    SAR: "﷼",
    DKK: "kr",
    SEK: "kr",
    NOK: "kr",
    AUD: "A$",
    CAD: "C$",
    KWD: "د.ك",
    CNY: "¥",
}

// ─── Revalidate Paths ────────────────────────────────────────────────────

export const PATHS = {
    DASHBOARD: "/dashboard" as const,
    PRODUCTS: "/inventory/products" as const,
    CATEGORIES: "/inventory/categories" as const,
    SUPPLIERS: "/inventory/suppliers" as const,
    CUSTOMERS: "/crm/customers" as const,
    ORDERS: "/finance/orders" as const,
    TRANSACTIONS: "/finance/transactions" as const,
    BANK_ACCOUNTS: "/finance/bank-accounts" as const,
    COST_CENTERS: "/finance/cost-centers" as const,
    CHECK_NOTES: "/finance/check-notes" as const,
    EMPLOYEES: "/hr/employees" as const,
    DEPARTMENTS: "/hr/departments" as const,
    LEAVE: "/hr/leave" as const,
    EINVOICE: "/accounting/e-invoice" as const,
    BA_BS: "/accounting/ba-bs" as const,
    CURRENCIES: "/accounting/currencies" as const,
    ENTRIES: "/accounting/entries" as const,
    TAX_TYPES: "/accounting/tax-types" as const,
    CUSTOMER_ACCOUNTS: "/accounting/customer-accounts" as const,
    SUPPLIER_ACCOUNTS: "/accounting/supplier-accounts" as const,
    ACCOUNTING_COST_CENTERS: "/accounting/cost-centers" as const,
    ACCOUNTING_BANK_ACCOUNTS: "/accounting/bank-accounts" as const,
    ACCOUNTING_CHECK_NOTES: "/accounting/check-notes" as const,
    DESPATCH_ADVICE: "/accounting/despatch-advice" as const,
    INFLATION_COEFFICIENTS: "/accounting/inflation-coefficients" as const,
} as const

// ─── Module Names (for logger) ──────────────────────────────────────────

export const MODULE = {
    PRODUCTS: "products" as const,
    CATEGORIES: "categories" as const,
    SUPPLIERS: "suppliers" as const,
    CUSTOMERS: "customers" as const,
    ORDERS: "orders" as const,
    TRANSACTIONS: "transactions" as const,
    BANK_ACCOUNTS: "bank-accounts" as const,
    COST_CENTERS: "cost-centers" as const,
    CHECK_NOTES: "check-notes" as const,
    EMPLOYEES: "employees" as const,
    DEPARTMENTS: "departments" as const,
    LEAVE_REQUESTS: "leave-requests" as const,
    DASHBOARD: "dashboard" as const,
    AUTH: "auth" as const,
    AUTH_UTILS: "auth-utils" as const,
    TR_ACCOUNTING: "tr-accounting" as const,
    NOTIFICATIONS: "notifications" as const,
    ACTIVITY_LOG: "activity-log" as const,
    REPORTS: "reports" as const,
    RATE_LIMIT: "rate-limit" as const,
} as const

export type ModuleName = (typeof MODULE)[keyof typeof MODULE]
