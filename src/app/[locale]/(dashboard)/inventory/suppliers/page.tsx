import { Link } from "@/i18n/navigation"
import { Plus, Building2, Package, CheckCircle, XCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { SuppliersTable } from "@/components/inventory/suppliers-table"
import { type Supplier } from "@/components/inventory/supplier-columns"
import { getSuppliers, getSupplierStats } from "@/lib/actions/suppliers"

export default async function SuppliersPage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations("inventory.suppliers")
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1
    const limit = Number(resolvedSearchParams?.limit) || 10
    const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : undefined

    const [paginatedSuppliers, stats] = await Promise.all([
        getSuppliers({ page, pageSize: limit, search }),
        getSupplierStats(),
    ])

    const suppliersData = "data" in paginatedSuppliers ? paginatedSuppliers.data : paginatedSuppliers
    const pageCount = "totalPages" in paginatedSuppliers ? paginatedSuppliers.totalPages : 1

    const suppliers: Supplier[] = suppliersData.map((s) => ({
        id: s.id,
        name: s.name,
        contactName: s.contactName || "",
        email: s.email || "",
        phone: s.phone || "",
        city: "",
        country: "",
        isActive: s.isActive,
        productCount: s.productCount,
    }))

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/inventory/suppliers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addSupplier")}
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalSuppliers")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {stats.total}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("active")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {stats.active}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("inactive")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {stats.inactive}
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalProducts")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                        {stats.totalProducts}
                    </p>
                </div>
            </div>

            <SuppliersTable 
                data={suppliers} 
                pageCount={pageCount}
                pagination={{ pageIndex: page - 1, pageSize: limit }}
            />
        </div>
    )
}
