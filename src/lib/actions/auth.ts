"use server"

import { signIn, signOut } from "@/lib/auth"
import { AuthError } from "next-auth"
import { isAppError } from "@/lib/errors"
import { checkLoginRateLimit, resetRateLimit } from "@/lib/rate-limit"
import logger from "@/lib/logger"
import { MODULE } from "@/lib/constants"

export async function login(formData: FormData) {
    try {
        const email = formData.get("email") as string

        // Brute-force protection: rate limit by email
        await checkLoginRateLimit(email)

        // Extract locale from form data for locale-aware redirect
        const locale = formData.get("locale") as string || "en"

        await signIn("credentials", {
            email,
            password: formData.get("password") as string,
            redirectTo: `/${locale}/dashboard`,
        })

        // Clear rate limit after successful login (unreachable here, but good practice)
        await resetRateLimit(`login:${email}`).catch(() => {})
    } catch (error) {
        // RateLimitError from brute-force protection
        if (isAppError(error)) {
            return { error: error.message }
        }

        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid email or password" }
                default:
                    logger.error("Login error", {
                        module: MODULE.AUTH,
                        error: { name: error.name, message: error.message, code: error.type },
                    })
                    return { error: "An unexpected error occurred. Please try again." }
            }
        }
        // NEXT_REDIRECT is expected for successful login — let it propagate
        throw error
    }
    // Unreachable: signIn always redirects or throws
    return undefined
}

export async function logout() {
    await signOut({ redirectTo: "/login" })
}
