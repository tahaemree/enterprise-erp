import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig, { JWT_MAX_AGE } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { checkLoginRateLimit, resetRateLimit } from "@/lib/rate-limit"
import logger from "@/lib/logger"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt", maxAge: JWT_MAX_AGE }, // Credentials provider REQUIRES jwt strategy
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const email = (credentials.email as string).toLowerCase().trim()
                const password = credentials.password as string

                // ─── Brute-force protection ────────────────────────────────
                await checkLoginRateLimit(email)

                // ─── Fetch user with tenant ────────────────────────────────
                const user = await prisma.user.findFirst({
                    where: { email },
                    include: { tenant: true },
                })

                if (!user || !user.password) {
                    logger.warn("Login attempt for non-existent user", {
                        module: "auth",
                        email: email.substring(0, 3) + "***",
                    })
                    return null
                }

                // ─── Check if tenant is active ────────────────────────────
                if (!user.tenant.isActive) {
                    logger.warn("Login attempt for inactive tenant", {
                        module: "auth",
                        tenantId: user.tenantId,
                        userId: user.id,
                    })
                    return null
                }

                // ─── Verify password ───────────────────────────────────────
                const passwordMatch = await bcrypt.compare(password, user.password)

                if (!passwordMatch) {
                    logger.warn("Failed login attempt", {
                        module: "auth",
                        email: email.substring(0, 3) + "***",
                    })
                    return null
                }

                // ─── Success — reset rate limit ───────────────────────────
                await resetRateLimit(`login:${email}`)

                logger.info("Successful login", {
                    module: "auth",
                    userId: user.id,
                    tenantId: user.tenantId,
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    permissions: user.permissions,
                }
            },
        }),
    ],
})
