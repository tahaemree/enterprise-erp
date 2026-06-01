import { test, expect } from "@playwright/test"

test("should redirect to login if not authenticated", async ({ page }) => {
    // Attempt to access dashboard directly
    await page.goto("/dashboard")
    
    // Should be redirected to the login page (in this app /auth/login)
    await expect(page).toHaveURL(/.*login.*/)
})

test("should contain login form on login page", async ({ page }) => {
    await page.goto("/tr/auth/login")
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
})
