import { getTranslations } from "next-intl/server"
import { DepartmentForm } from "@/components/hr/department-form"

import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"

export default async function NewEntityPage(props: { searchParams: Promise<{ edit?: string }> }) {
    const searchParams = await props.searchParams;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    let initialData = undefined
    if (searchParams.edit) {
        const entity = await db.department.findUnique({
            where: { id: searchParams.edit }
        })
        if (!entity) notFound()
        initialData = entity
    }

    const t = await getTranslations("departmentForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-2xl">
                <DepartmentForm initialData={initialData} />
            </div>
        </div>
    )
}
