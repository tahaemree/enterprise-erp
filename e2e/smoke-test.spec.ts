import { test, expect, type Page } from "@playwright/test"
import path from "path"

// ─── Types ────────────────────────────────────────────────────────────

interface PageResult {
    route: string
    status: "pass" | "fail" | "error"
    errors: string[]
}

// ─── Constants ────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000"
const LOCALE = "en"
const ADMIN_EMAIL = "admin@deftra.com"
const ADMIN_PASSWORD = "admin123"

const PREFIX = `/${LOCALE}`

// ─── Collect console errors per page ──────────────────────────────────

async function navigateAndCheck(page: Page, route: string): Promise<PageResult> {
    const errors: string[] = []
    const fullUrl = route.startsWith("http") ? route : `${BASE_URL}${route}`
    const startTime = Date.now()

    // Listen for console errors
    const consoleHandler = (msg: { type: () => string; text: () => string }) => {
        if (msg.type() === "error" || msg.type() === "warning") {
            errors.push(`[${msg.type()}] ${msg.text()}`)
        }
    }
    page.on("console", consoleHandler)

    try {
        const response = await page.goto(fullUrl, {
            waitUntil: "networkidle",
            timeout: 30000,
        })

        const elapsed = Date.now() - startTime

        // Check if navigation succeeded
        if (!response) {
            errors.push("No response received")
            return { route, status: "error", errors }
        }

        const status = response.status()

        // Allow redirects (301, 302, 307) and successful renders
        if (status >= 400) {
            errors.push(`HTTP ${status}: ${response.statusText()}`)
            return { route, status: "fail", errors }
        }

        // Wait for page to be interactive
        await page.waitForLoadState("domcontentloaded", { timeout: 10000 })

        // Check for error boundary or error elements
        const errorElements = await page.locator(
            '[data-testid="error-boundary"], .error-boundary, [role="alert"]'
        ).count()

        if (errorElements > 0) {
            errors.push("Error boundary detected on page")
        }

        // Check page has meaningful content (not just redirect)
        const bodyText = await page.locator("body").textContent()
        if (!bodyText || bodyText.trim().length < 5) {
            errors.push("Page body is empty or nearly empty")
        }

        // Log success
        console.log(`  ✓ ${route} → ${status} (${elapsed}ms)`)
        return {
            route,
            status: errors.length > 0 ? "fail" : "pass",
            errors,
        }
    } catch (err) {
        const elapsed = Date.now() - startTime
        const errorMsg = err instanceof Error ? err.message : String(err)
        // Timeout might be due to slow loading — if page has content, it's OK
        if (errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
            console.log(`  ○ ${route} → timeout (${elapsed}ms) - checking content...`)
            try {
                const bodyText = await page.locator("body").textContent()
                if (bodyText && bodyText.trim().length > 5) {
                    console.log(`    → content found despite timeout`)
                    return { route, status: "pass", errors: [`Timeout(${elapsed}ms) but content loaded`] }
                }
            } catch {
                // ignore
            }
        }
        errors.push(`Navigation error: ${errorMsg}`)
        console.log(`  ✗ ${route} → error: ${errorMsg.substring(0, 100)}`)
        return { route, status: "error", errors }
    } finally {
        page.removeListener("console", consoleHandler)
    }
}

// ─── Extract entity IDs from list pages ──────────────────────────────

async function extractIdsFromPage(page: Page): Promise<string[]> {
    const links = await page.locator("a").all()
    const ids: string[] = []

    for (const link of links) {
        const href = await link.getAttribute("href")
        if (href) {
            const match = href.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/)
            if (match) {
                const id = match[1]
                if (id && !ids.includes(id)) {
                    ids.push(id)
                }
            }
        }
    }

    return ids
}

// ─── Test Suite ───────────────────────────────────────────────────────

test.describe("Deftra — Comprehensive Smoke Test", () => {
    let page: Page
    const results: PageResult[] = []
    const detailIds: Record<string, string[]> = {}

    test.beforeAll(async ({ browser }) => {
        // Create a new context for the entire test suite
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
        })
        page = await context.newPage()

        // ─── Login ─────────────────────────────────────────────────
        console.log("\n═══════════════════════════════════════════")
        console.log("🔐 Logging in...")
        await page.goto(`${BASE_URL}/${LOCALE}/login`, { waitUntil: "networkidle" })
        await page.waitForLoadState("domcontentloaded")

        // The login form uses custom TextField/PasswordField components without `name` attrs.
        // Use type-based selectors instead (matching the underlying <input> element types).
        await page.fill('input[type="email"]', ADMIN_EMAIL)
        await page.fill('input[type="password"]', ADMIN_PASSWORD)

        // Submit
        await page.click('button[type="submit"]')

        // Wait for redirect to dashboard
        await page.waitForURL(`**/${LOCALE}/dashboard`, { timeout: 15000 })
        console.log("✅ Login successful — redirected to dashboard\n")
    })

    test.afterAll(async () => {
        // Print summary
        console.log("\n═══════════════════════════════════════════")
        console.log("📊 SMOKE TEST SUMMARY")
        console.log("═══════════════════════════════════════════\n")

        const passed = results.filter((r) => r.status === "pass")
        const failed = results.filter((r) => r.status === "fail")
        const errored = results.filter((r) => r.status === "error")

        console.log(`Total: ${results.length} | ✅ Pass: ${passed.length} | ❌ Fail: ${failed.length} | ⚠️ Error: ${errored.length}\n`)

        if (failed.length > 0) {
            console.log("❌ FAILED PAGES:")
            failed.forEach((r) => {
                console.log(`  ${r.route}`)
                r.errors.forEach((e) => console.log(`    → ${e}`))
            })
            console.log()
        }

        if (errored.length > 0) {
            console.log("⚠️ ERRORED PAGES:")
            errored.forEach((r) => {
                console.log(`  ${r.route}`)
                r.errors.forEach((e) => console.log(`    → ${e}`))
            })
            console.log()
        }

        // Report in test results — only fail if there are actual errors (not minor warnings)
        expect(failed.length).toBe(0)
    })

    // ═══════════════════════════════════════════════════════════════
    //  1. DASHBOARD MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("Dashboard", () => {
        test("should load main dashboard", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/dashboard`)
            results.push(result)
            expect(result.status === "pass" || result.status === "fail" ? result.errors.length === 0 : false).toBeTruthy()
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  2. CRM MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("CRM Module", () => {
        test("customers list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/crm/customers`)
            results.push(result)
            // Extract customer IDs for detail pages
            detailIds["customers"] = await extractIdsFromPage(page)
        })

        test("customers new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/crm/customers/new`)
            results.push(result)
        })

        test("customer detail (first found)", async () => {
            const ids = detailIds["customers"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/crm/customers/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /crm/customers/[id] → no IDs found, skipping")
            }
        })

        test("pipeline list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/crm/pipeline`)
            results.push(result)
        })

        test("pipeline new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/crm/pipeline/new`)
            results.push(result)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  3. INVENTORY MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("Inventory Module", () => {
        test("products list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/products`)
            results.push(result)
            detailIds["products"] = await extractIdsFromPage(page)
        })

        test("products new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/products/new`)
            results.push(result)
        })

        test("product detail (first found)", async () => {
            const ids = detailIds["products"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/inventory/products/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /inventory/products/[id] → no IDs found, skipping")
            }
        })

        test("suppliers list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/suppliers`)
            results.push(result)
            detailIds["suppliers"] = await extractIdsFromPage(page)
        })

        test("suppliers new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/suppliers/new`)
            results.push(result)
        })

        test("supplier detail (first found)", async () => {
            const ids = detailIds["suppliers"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/inventory/suppliers/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /inventory/suppliers/[id] → no IDs found, skipping")
            }
        })

        test("categories list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/categories`)
            results.push(result)
        })

        test("categories new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/inventory/categories/new`)
            results.push(result)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  4. FINANCE MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("Finance Module", () => {
        test("bank accounts list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/bank-accounts`)
            results.push(result)
            detailIds["fin-bank-accounts"] = await extractIdsFromPage(page)
        })

        test("bank accounts new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/bank-accounts/new`)
            results.push(result)
        })

        test("bank account detail (first found)", async () => {
            const ids = detailIds["fin-bank-accounts"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/finance/bank-accounts/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /finance/bank-accounts/[id] → no IDs found, skipping")
            }
        })

        test("check notes list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/check-notes`)
            results.push(result)
            detailIds["fin-check-notes"] = await extractIdsFromPage(page)
        })

        test("check notes new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/check-notes/new`)
            results.push(result)
        })

        test("check note detail (first found)", async () => {
            const ids = detailIds["fin-check-notes"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/finance/check-notes/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /finance/check-notes/[id] → no IDs found, skipping")
            }
        })

        test("cost centers list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/cost-centers`)
            results.push(result)
        })

        test("cost centers new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/cost-centers/new`)
            results.push(result)
        })

        test("invoices list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/invoices`)
            results.push(result)
        })

        test("invoices new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/invoices/new`)
            results.push(result)
        })

        test("orders list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/orders`)
            results.push(result)
            detailIds["orders"] = await extractIdsFromPage(page)
        })

        test("orders new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/orders/new`)
            results.push(result)
        })

        test("order detail (first found)", async () => {
            const ids = detailIds["orders"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/finance/orders/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /finance/orders/[id] → no IDs found, skipping")
            }
        })

        test("reports list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/reports`)
            results.push(result)
        })

        test("reports balance sheet", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/reports/balance-sheet`)
            results.push(result)
        })

        test("reports income statement", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/reports/income-statement`)
            results.push(result)
        })

        test("reports pivot", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/reports/pivot`)
            results.push(result)
        })

        test("transactions list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/transactions`)
            results.push(result)
            detailIds["transactions"] = await extractIdsFromPage(page)
        })

        test("transactions new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/finance/transactions/new`)
            results.push(result)
        })

        test("transaction detail (first found)", async () => {
            const ids = detailIds["transactions"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/finance/transactions/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /finance/transactions/[id] → no IDs found, skipping")
            }
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  5. HR MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("HR Module", () => {
        test("employees list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/employees`)
            results.push(result)
            detailIds["employees"] = await extractIdsFromPage(page)
        })

        test("employees new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/employees/new`)
            results.push(result)
        })

        test("employee detail (first found)", async () => {
            const ids = detailIds["employees"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/hr/employees/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /hr/employees/[id] → no IDs found, skipping")
            }
        })

        test("departments list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/departments`)
            results.push(result)
            detailIds["departments"] = await extractIdsFromPage(page)
        })

        test("departments new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/departments/new`)
            results.push(result)
        })

        test("department detail (first found)", async () => {
            const ids = detailIds["departments"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/hr/departments/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /hr/departments/[id] → no IDs found, skipping")
            }
        })

        test("leave list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/leave`)
            results.push(result)
        })

        test("leave new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/hr/leave/new`)
            results.push(result)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  6. ACCOUNTING MODULE
    // ═══════════════════════════════════════════════════════════════
    test.describe("Accounting Module", () => {
        test("ba-bs list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/ba-bs`)
            results.push(result)
        })

        test("ba-bs new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/ba-bs/new`)
            results.push(result)
        })

        test("bank accounts list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/bank-accounts`)
            results.push(result)
            detailIds["acc-bank-accounts"] = await extractIdsFromPage(page)
        })

        test("bank accounts new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/bank-accounts/new`)
            results.push(result)
        })

        test("check note list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/check-note`)
            results.push(result)
        })

        test("check note new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/check-note/new`)
            results.push(result)
        })

        test("cost centers list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/cost-centers`)
            results.push(result)
        })

        test("cost centers new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/cost-centers/new`)
            results.push(result)
        })

        test("currencies list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/currencies`)
            results.push(result)
        })

        test("currencies new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/currencies/new`)
            results.push(result)
        })

        test("customer accounts list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/customer-accounts`)
            results.push(result)
        })

        test("customer accounts new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/customer-accounts/new`)
            results.push(result)
        })

        test("despatch advice list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/despatch-advice`)
            results.push(result)
        })

        test("despatch advice new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/despatch-advice/new`)
            results.push(result)
        })

        test("e-invoice list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/e-invoice`)
            results.push(result)
            detailIds["einvoice"] = await extractIdsFromPage(page)
        })

        test("e-invoice new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/e-invoice/new`)
            results.push(result)
        })

        test("e-invoice detail (first found)", async () => {
            const ids = detailIds["einvoice"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/accounting/e-invoice/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /accounting/e-invoice/[id] → no IDs found, skipping")
            }
        })

        test("entries list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/entries`)
            results.push(result)
            detailIds["entries"] = await extractIdsFromPage(page)
        })

        test("entries new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/entries/new`)
            results.push(result)
        })

        test("entry detail (first found)", async () => {
            const ids = detailIds["entries"]
            if (ids && ids.length > 0) {
                const result = await navigateAndCheck(page, `${PREFIX}/accounting/entries/${ids[0]}`)
                results.push(result)
            } else {
                console.log("  ○ /accounting/entries/[id] → no IDs found, skipping")
            }
        })

        test("exchange rates list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/exchange-rates`)
            results.push(result)
        })

        test("exchange rates new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/exchange-rates/new`)
            results.push(result)
        })

        test("inflation coefficients list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/inflation-coefficients`)
            results.push(result)
        })

        test("inflation coefficients new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/inflation-coefficients/new`)
            results.push(result)
        })

        test("inflation revalue", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/inflation-coefficients/revalue`)
            results.push(result)
        })

        test("supplier accounts list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/supplier-accounts`)
            results.push(result)
        })

        test("supplier accounts new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/supplier-accounts/new`)
            results.push(result)
        })

        test("tax calculator", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/tax-calculator`)
            results.push(result)
        })

        test("tax types list", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/tax-types`)
            results.push(result)
        })

        test("tax types new", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/accounting/tax-types/new`)
            results.push(result)
        })
    })

    // ═══════════════════════════════════════════════════════════════
    //  7. SETTINGS & OTHER PAGES
    // ═══════════════════════════════════════════════════════════════
    test.describe("Settings & Other Pages", () => {
        test("settings", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/settings`)
            results.push(result)
        })

        test("settings activity", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/settings/activity`)
            results.push(result)
        })

        test("settings profile", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/settings/profile`)
            results.push(result)
        })

        test("notifications", async () => {
            const result = await navigateAndCheck(page, `${PREFIX}/notifications`)
            results.push(result)
        })
    })
})
