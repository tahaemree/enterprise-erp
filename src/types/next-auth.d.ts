import "next-auth"
import { JWT } from "next-auth/jwt"
import type { UserRole } from "@prisma/client"

declare module "@auth/core/adapters" {
    interface AdapterUser {
        role: UserRole
        tenantId: string
        permissions: string[]
    }
}

declare module "next-auth" {
    interface User {
        role: UserRole
        tenantId: string
        permissions: string[]
    }

    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: UserRole
            tenantId: string
            permissions: string[]
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        tenantId: string
        permissions: string[]
    }
}
