import { getTranslations } from "next-intl/server"
import { SupplierForm } from "@/components/inventory/supplier-form"
import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"

export default async function NewSupplierPage(props: { searchParams: Promise<{ edit?: string }> }) {
    const searchParams = await props.searchParams;
    const t = await getTranslations("supplierForm")
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)

    let initialData = undefined
    if (searchParams.edit) {
        const supplier = await db.supplier.findUnique({
            where: { id: searchParams.edit }
        })
        if (!supplier) notFound()
        initialData = {
            id: supplier.id,
            name: supplier.name,
            contactName: supplier.contactName || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
            city: supplier.city || "",
            country: supplier.country || "",
            isActive: supplier.isActive,
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {searchParams.edit ? t("editTitle", { fallback: "Edit Supplier" }) : t("title")}
                </h1>
                <p className="text-muted-foreground">
                    {searchParams.edit ? t("editDescription", { fallback: "Update supplier details." }) : t("description")}
                </p>
            </div>
            <div className="max-w-2xl">
                <SupplierForm initialData={initialData} />
            </div>
        </div>
    )
}
