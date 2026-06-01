import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
    test("should redirect to login if not authenticated", async ({ page }) => {
        await page.goto("/dashboard")
        
        // Wait for redirect to login page
        await expect(page).toHaveURL(/.*\/login/)
    })
})
