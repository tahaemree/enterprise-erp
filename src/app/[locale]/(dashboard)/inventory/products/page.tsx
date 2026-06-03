import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, Package } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { ProductsTable } from "@/components/inventory/products-table"
import { getProducts, getProductsStats, type ProductWithRelations } from "@/lib/actions/products"
import { PaginatedResult } from "@/lib/pagination"

export default async function ProductsPage({
    params: _params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations("inventory.products")
    
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams?.page) || 1
    const pageSize = Number(resolvedSearchParams?.pageSize) || 10
    const search = resolvedSearchParams?.search as string | undefined

    const productsResult = await getProducts({ page, pageSize, search }) as PaginatedResult<ProductWithRelations>
    const stats = await getProductsStats()

    const formattedProducts = productsResult.data.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        costPrice: p.costPrice ? Number(p.costPrice) : 0,
        quantity: Number(p.quantity),
        minStock: p.minStock ? Number(p.minStock) : 0,
        unit: "piece",
        isActive: p.isActive,
        category: p.category
            ? { id: p.category.id, name: p.category.name }
            : undefined,
        supplier: p.supplier
            ? { id: p.supplier.id, name: p.supplier.name }
            : undefined,
        createdAt: p.createdAt,
    }))

    const { totalProducts, inStock, lowStock, outOfStock } = stats

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/inventory/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addProduct")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("totalProducts")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{totalProducts}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("inStock")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{inStock}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("lowStock")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{lowStock}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("outOfStock")}
                        </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{outOfStock}</p>
                </div>
            </div>

            <ProductsTable 
                data={formattedProducts} 
                pageCount={productsResult.totalPages}
                currentPage={productsResult.page}
                pageSize={productsResult.pageSize}
                searchQuery={search}
            />
        </div>
    )
}
