import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import { PermissionsClient } from "./permissions-client"

export const metadata = {
    title: "Rol ve Yetki Matrisi",
}

export default async function PermissionsPage() {
    const user = await requireAuth()
    
    // Yalnızca ADMIN yetkileri yönetebilir
    requireAdmin(user)

    const db = getTenantPrisma(user.tenantId)

    // Tüm şirket çalışanlarını getir
    const users = await db.user.findMany({
        where: { tenantId: user.tenantId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Yetkilendirme Matrisi</h2>
                <p className="text-muted-foreground mt-1">
                    Çalışanlarınızın modül bazlı erişim yetkilerini (RBAC) buradan yönetebilirsiniz. 
                    ADMIN rolündeki kullanıcılar varsayılan olarak tüm yetkilere sahiptir.
                </p>
            </div>

            <PermissionsClient users={users} />
        </div>
    )
}
