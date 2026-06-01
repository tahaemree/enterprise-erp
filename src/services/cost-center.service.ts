import { getTenantPrisma } from "@/lib/prisma"
import { CostCenterFormValues } from "@/lib/validations/finance"

export class CostCenterService {
    static async getCostCenters(tenantId: string) {
        const db = getTenantPrisma(tenantId)
        return await db.costCenter.findMany({
            orderBy: { code: "asc" },
        })
    }

    static async getCostCenterById(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        return await db.costCenter.findUnique({
            where: { id, tenantId }
        })
    }

    static async createCostCenter(tenantId: string, data: CostCenterFormValues) {
        const db = getTenantPrisma(tenantId)
        return await db.costCenter.create({
            data: {
                tenantId,
                code: data.code,
                name: data.name,
                description: data.description,
                isActive: data.isActive
            }
        })
    }

    static async updateCostCenter(tenantId: string, id: string, data: CostCenterFormValues) {
        const db = getTenantPrisma(tenantId)
        return await db.costCenter.update({
            where: { id, tenantId },
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                isActive: data.isActive
            }
        })
    }

    static async deleteCostCenter(tenantId: string, id: string) {
        const db = getTenantPrisma(tenantId)
        return await db.costCenter.delete({
            where: { id, tenantId }
        })
    }
}
