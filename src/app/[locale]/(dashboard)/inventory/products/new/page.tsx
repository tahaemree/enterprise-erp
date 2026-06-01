import { getCategories } from "@/lib/actions/categories"
import { getSuppliers } from "@/lib/actions/suppliers"
import { getProduct } from "@/lib/actions/products"
import { ProductForm } from "@/components/inventory/product-form"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

export default async function NewProductPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await props.searchParams
    const editId = resolvedSearchParams?.edit as string | undefined
    const t = await getTranslations("productForm")

    const [categories, suppliers] = await Promise.all([
        getCategories(),
        getSuppliers(),
    ])

    const mappedCategories = categories.map((c) => ({ id: c.id, name: c.name }))
    const mappedSuppliers = suppliers.map((s) => ({ id: s.id, name: s.name }))

    // Edit mode: load existing product data
    let initialData = undefined
    if (editId) {
        const product = await getProduct(editId)
        if (!product) {
            notFound()
        }
        initialData = {
            id: product.id,
            name: product.name,
            description: product.description || "",
            sku: product.sku,
            barcode: product.barcode || "",
            price: Number(product.price),
            costPrice: product.costPrice ? Number(product.costPrice) : undefined,
            quantity: Number(product.quantity),
            minStock: product.minStock ? Number(product.minStock) : 10,
            maxStock: product.maxStock ? Number(product.maxStock) : undefined,
            unit: product.unit || "piece",
            categoryId: product.category?.id || "",
            supplierId: product.supplier?.id || "",
            isActive: product.isActive,
        }
    }

    return (
        <ProductForm 
            categories={mappedCategories} 
            suppliers={mappedSuppliers} 
            initialData={initialData}
        />
    )
}
