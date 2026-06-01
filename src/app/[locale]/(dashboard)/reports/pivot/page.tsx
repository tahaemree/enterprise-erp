import { getTranslations } from "next-intl/server"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { PivotTable } from "@/components/reporting/pivot-table"
import type { ColumnDef } from "@tanstack/react-table"

export const metadata = {
    title: "Dinamik Pivot Raporlar",
}

export default async function PivotReportsPage() {
    const user = await requireAuth()
    
    // Yalnızca raporlama iznine sahip olanlar girebilir (veya ADMIN)
    requirePermission(user, "reports:read")

    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("reports")

    // Örnek: Satış Analizi için Sipariş Kalemlerini çekiyoruz
    const orderItems = await db.orderItem.findMany({
        where: { order: { deletedAt: null } },
        include: {
            order: { include: { customer: true } },
            product: { include: { category: true } }
        },
        take: 1000 // Limit for performance
    })

    const rawData = orderItems.map(item => ({
        id: item.id,
        customerName: item.order.customer.firstName + " " + item.order.customer.lastName,
        categoryName: item.product?.category?.name || "Kategorisiz",
        productName: item.productName,
        status: item.order.status,
        quantity: Number(item.quantity),
        total: Number(item.total),
    }))

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dinamik Pivot Analizi</h2>
                    <p className="text-muted-foreground mt-1">
                        Sürükle bırak mantığıyla Kategori, Müşteri ve Ürün bazlı satış toplamlarını anında analiz edin.
                    </p>
                </div>
            </div>

            <PivotClientWrapper data={rawData} />
        </div>
    )
}

// Client bileşen wrapper'ı (Kolon tanımlarını yapmak için)
import { PivotClientWrapper } from "./pivot-client"
