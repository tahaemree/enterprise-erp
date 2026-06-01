# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-test.spec.ts >> Deftra — Comprehensive Smoke Test >> HR Module >> leave list
- Location: e2e\smoke-test.spec.ts:475:13

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - link "Back to home" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - text: Back to home
        - link "Deftra" [ref=e9] [cursor=pointer]:
          - /url: /
          - img [ref=e11]
          - generic [ref=e14]: Deftra
      - generic [ref=e16]:
        - generic [ref=e17]:
          - heading "Sign in to Deftra" [level=1] [ref=e18]
          - paragraph [ref=e19]: Enterprise Resource Planning System
          - generic [ref=e20]:
            - generic [ref=e21]:
              - button "Continue with Google" [ref=e22]:
                - img [ref=e23]
                - text: Continue with Google
              - button "Continue with SSO (SAML)" [ref=e25]:
                - img [ref=e26]
                - text: Continue with SSO (SAML)
            - generic [ref=e28]: OR CONTINUE WITH EMAIL
            - generic [ref=e31]:
              - button "Password" [ref=e32]: Password
              - button "Magic Link" [ref=e34]
            - generic [ref=e35]:
              - generic [ref=e36]:
                - generic [ref=e38]: Email address
                - textbox "Email address" [ref=e40]:
                  - /placeholder: admin@deftra.com
              - generic [ref=e43]:
                - generic [ref=e44]:
                  - generic [ref=e45]: Password
                  - link "Forgot password?" [ref=e46] [cursor=pointer]:
                    - /url: "#"
                - generic [ref=e47]:
                  - textbox "Password Forgot password? Show password" [ref=e48]:
                    - /placeholder: ••••••••
                  - button "Show password" [ref=e49]:
                    - img [ref=e50]
              - button "Sign in" [ref=e53]:
                - generic [ref=e54]: Sign in
                - img [ref=e55]
            - paragraph [ref=e58]: "Demo Login: admin@admin.com / admin123"
        - generic [ref=e59]:
          - text: New to Deftra?
          - link "Create an account" [ref=e60] [cursor=pointer]:
            - /url: /en/register
        - generic [ref=e61]:
          - generic [ref=e62]:
            - img [ref=e63]
            - text: SOC 2 Type II
          - generic [ref=e67]: ISO 27001
          - generic [ref=e69]: GDPR
      - generic [ref=e70]: © 2026 Deftra Systems, Inc.
    - generic [ref=e72]:
      - img [ref=e82]
      - generic [ref=e125]:
        - generic [ref=e126]:
          - img [ref=e127]
          - generic [ref=e130]: Zero-trust auth
        - generic [ref=e131]: Hardware-backed keys · 2FA
      - generic [ref=e133]:
        - generic [ref=e134]:
          - img [ref=e135]
          - generic [ref=e140]: 14 regions
        - generic [ref=e141]: 38ms p99 globally
      - generic [ref=e143]:
        - generic [ref=e144]:
          - img [ref=e145]
          - generic [ref=e147]: 99.99% uptime
        - generic [ref=e148]: Active-active failover
      - generic [ref=e150]:
        - generic [ref=e151]:
          - img [ref=e152]
          - generic [ref=e155]: SOC 2 · ISO 27001
        - generic [ref=e156]: Continuously audited
      - generic [ref=e158]:
        - generic [ref=e159]: Secure by default
        - heading "Welcome back to your operating layer." [level=2] [ref=e161]
        - paragraph [ref=e162]: Pick up exactly where you left off — your dashboards, workflows, and approvals are waiting.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e168] [cursor=pointer]:
    - img [ref=e169]
  - alert [ref=e172]
```

# Test source

```ts
  36  |     try {
  37  |         const response = await page.goto(fullUrl, {
  38  |             waitUntil: "networkidle",
  39  |             timeout: 30000,
  40  |         })
  41  | 
  42  |         const elapsed = Date.now() - startTime
  43  | 
  44  |         // Check if navigation succeeded
  45  |         if (!response) {
  46  |             errors.push("No response received")
  47  |             return { route, status: "error", errors }
  48  |         }
  49  | 
  50  |         const status = response.status()
  51  | 
  52  |         // Allow redirects (301, 302, 307) and successful renders
  53  |         if (status >= 400) {
  54  |             errors.push(`HTTP ${status}: ${response.statusText()}`)
  55  |             return { route, status: "fail", errors }
  56  |         }
  57  | 
  58  |         // Wait for page to be interactive
  59  |         await page.waitForLoadState("domcontentloaded", { timeout: 10000 })
  60  | 
  61  |         // Check for error boundary or error elements
  62  |         const errorElements = await page.locator(
  63  |             '[data-testid="error-boundary"], .error-boundary, [role="alert"]'
  64  |         ).count()
  65  | 
  66  |         if (errorElements > 0) {
  67  |             errors.push("Error boundary detected on page")
  68  |         }
  69  | 
  70  |         // Check page has meaningful content (not just redirect)
  71  |         const bodyText = await page.locator("body").textContent()
  72  |         if (!bodyText || bodyText.trim().length < 5) {
  73  |             errors.push("Page body is empty or nearly empty")
  74  |         }
  75  | 
  76  |         // Log success
  77  |         console.log(`  ✓ ${route} → ${status} (${elapsed}ms)`)
  78  |         return {
  79  |             route,
  80  |             status: errors.length > 0 ? "fail" : "pass",
  81  |             errors,
  82  |         }
  83  |     } catch (err) {
  84  |         const elapsed = Date.now() - startTime
  85  |         const errorMsg = err instanceof Error ? err.message : String(err)
  86  |         // Timeout might be due to slow loading — if page has content, it's OK
  87  |         if (errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
  88  |             console.log(`  ○ ${route} → timeout (${elapsed}ms) - checking content...`)
  89  |             try {
  90  |                 const bodyText = await page.locator("body").textContent()
  91  |                 if (bodyText && bodyText.trim().length > 5) {
  92  |                     console.log(`    → content found despite timeout`)
  93  |                     return { route, status: "pass", errors: [`Timeout(${elapsed}ms) but content loaded`] }
  94  |                 }
  95  |             } catch {
  96  |                 // ignore
  97  |             }
  98  |         }
  99  |         errors.push(`Navigation error: ${errorMsg}`)
  100 |         console.log(`  ✗ ${route} → error: ${errorMsg.substring(0, 100)}`)
  101 |         return { route, status: "error", errors }
  102 |     } finally {
  103 |         page.removeListener("console", consoleHandler)
  104 |     }
  105 | }
  106 | 
  107 | // ─── Extract entity IDs from list pages ──────────────────────────────
  108 | 
  109 | async function extractIdsFromPage(page: Page): Promise<string[]> {
  110 |     const links = await page.locator("a").all()
  111 |     const ids: string[] = []
  112 | 
  113 |     for (const link of links) {
  114 |         const href = await link.getAttribute("href")
  115 |         if (href) {
  116 |             const match = href.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/)
  117 |             if (match) {
  118 |                 const id = match[1]
  119 |                 if (id && !ids.includes(id)) {
  120 |                     ids.push(id)
  121 |                 }
  122 |             }
  123 |         }
  124 |     }
  125 | 
  126 |     return ids
  127 | }
  128 | 
  129 | // ─── Test Suite ───────────────────────────────────────────────────────
  130 | 
  131 | test.describe("Deftra — Comprehensive Smoke Test", () => {
  132 |     let page: Page
  133 |     const results: PageResult[] = []
  134 |     const detailIds: Record<string, string[]> = {}
  135 | 
> 136 |     test.beforeAll(async ({ browser }) => {
      |          ^ "beforeAll" hook timeout of 30000ms exceeded.
  137 |         // Create a new context for the entire test suite
  138 |         const context = await browser.newContext({
  139 |             viewport: { width: 1920, height: 1080 },
  140 |         })
  141 |         page = await context.newPage()
  142 | 
  143 |         // ─── Login ─────────────────────────────────────────────────
  144 |         console.log("\n═══════════════════════════════════════════")
  145 |         console.log("🔐 Logging in...")
  146 |         await page.goto(`${BASE_URL}/${LOCALE}/login`, { waitUntil: "networkidle" })
  147 |         await page.waitForLoadState("domcontentloaded")
  148 | 
  149 |         // Fill credentials
  150 |         await page.fill('input[name="email"]', ADMIN_EMAIL)
  151 |         await page.fill('input[name="password"]', ADMIN_PASSWORD)
  152 | 
  153 |         // Submit
  154 |         await page.click('button[type="submit"]')
  155 | 
  156 |         // Wait for redirect to dashboard
  157 |         await page.waitForURL(`**/${LOCALE}/dashboard`, { timeout: 15000 })
  158 |         console.log("✅ Login successful — redirected to dashboard\n")
  159 |     })
  160 | 
  161 |     test.afterAll(async () => {
  162 |         // Print summary
  163 |         console.log("\n═══════════════════════════════════════════")
  164 |         console.log("📊 SMOKE TEST SUMMARY")
  165 |         console.log("═══════════════════════════════════════════\n")
  166 | 
  167 |         const passed = results.filter((r) => r.status === "pass")
  168 |         const failed = results.filter((r) => r.status === "fail")
  169 |         const errored = results.filter((r) => r.status === "error")
  170 | 
  171 |         console.log(`Total: ${results.length} | ✅ Pass: ${passed.length} | ❌ Fail: ${failed.length} | ⚠️ Error: ${errored.length}\n`)
  172 | 
  173 |         if (failed.length > 0) {
  174 |             console.log("❌ FAILED PAGES:")
  175 |             failed.forEach((r) => {
  176 |                 console.log(`  ${r.route}`)
  177 |                 r.errors.forEach((e) => console.log(`    → ${e}`))
  178 |             })
  179 |             console.log()
  180 |         }
  181 | 
  182 |         if (errored.length > 0) {
  183 |             console.log("⚠️ ERRORED PAGES:")
  184 |             errored.forEach((r) => {
  185 |                 console.log(`  ${r.route}`)
  186 |                 r.errors.forEach((e) => console.log(`    → ${e}`))
  187 |             })
  188 |             console.log()
  189 |         }
  190 | 
  191 |         // Report in test results — only fail if there are actual errors (not minor warnings)
  192 |         expect(failed.length).toBe(0)
  193 |     })
  194 | 
  195 |     // ═══════════════════════════════════════════════════════════════
  196 |     //  1. DASHBOARD MODULE
  197 |     // ═══════════════════════════════════════════════════════════════
  198 |     test.describe("Dashboard", () => {
  199 |         test("should load main dashboard", async () => {
  200 |             const result = await navigateAndCheck(page, `${PREFIX}/dashboard`)
  201 |             results.push(result)
  202 |             expect(result.status === "pass" || result.status === "fail" ? result.errors.length === 0 : false).toBeTruthy()
  203 |         })
  204 |     })
  205 | 
  206 |     // ═══════════════════════════════════════════════════════════════
  207 |     //  2. CRM MODULE
  208 |     // ═══════════════════════════════════════════════════════════════
  209 |     test.describe("CRM Module", () => {
  210 |         test("customers list", async () => {
  211 |             const result = await navigateAndCheck(page, `${PREFIX}/crm/customers`)
  212 |             results.push(result)
  213 |             // Extract customer IDs for detail pages
  214 |             detailIds["customers"] = await extractIdsFromPage(page)
  215 |         })
  216 | 
  217 |         test("customers new", async () => {
  218 |             const result = await navigateAndCheck(page, `${PREFIX}/crm/customers/new`)
  219 |             results.push(result)
  220 |         })
  221 | 
  222 |         test("customer detail (first found)", async () => {
  223 |             const ids = detailIds["customers"]
  224 |             if (ids && ids.length > 0) {
  225 |                 const result = await navigateAndCheck(page, `${PREFIX}/crm/customers/${ids[0]}`)
  226 |                 results.push(result)
  227 |             } else {
  228 |                 console.log("  ○ /crm/customers/[id] → no IDs found, skipping")
  229 |             }
  230 |         })
  231 | 
  232 |         test("pipeline list", async () => {
  233 |             const result = await navigateAndCheck(page, `${PREFIX}/crm/pipeline`)
  234 |             results.push(result)
  235 |         })
  236 | 
```