import { notFound } from "next/navigation"
import { getProduct } from "@/lib/actions/products"
import { getTranslations } from "next-intl/server"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Tag, Building2, Edit, Calendar, DollarSign, Archive, BarChart2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Prisma } from "@prisma/client"

type ProductWithRelations = NonNullable<Prisma.ProductGetPayload<{
    include: {
        category: true
        supplier: true
        orderItems: {
            include: { order: true }
        }
    }
}>>

type OrderItemWithOrder = ProductWithRelations["orderItems"][number]

export default async function ProductDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const t = await getTranslations("products")
    const product = await getProduct(params.id)

    if (!product) {
        notFound()
    }

    const detail = product as unknown as ProductWithRelations
    const orderItems = detail.orderItems ?? []

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {detail.name}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="font-medium text-foreground">{detail.sku}</span>
                        {detail.barcode && <span>• {detail.barcode}</span>}
                        <Badge variant={detail.isActive ? "default" : "secondary"}>
                            {detail.isActive ? t("active", { fallback: "Active" }) : t("inactive", { fallback: "Inactive" })}
                        </Badge>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/inventory/products/new?edit=${detail.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t("productDetails", { fallback: "Product Details" })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {detail.images && detail.images.length > 0 ? (
                            <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                                <Image
                                    src={detail.images[0] as string}
                                    alt={detail.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-square relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                <Package className="w-12 h-12 text-muted-foreground/50" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-4">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span>
                                {t("category", { fallback: "Category" })}:{" "}
                                <span className="font-medium">{detail.category?.name || t("uncategorized", { fallback: "Uncategorized" })}</span>
                            </span>
                        </div>
                        
                        {detail.supplier && (
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>
                                    {t("supplier", { fallback: "Supplier" })}:{" "}
                                    <span className="font-medium">{detail.supplier.name}</span>
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{t("addedOn", { fallback: "Added on" })}: {formatDate(detail.createdAt)}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                                {t("overview", { fallback: "Overview" })}
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                                {t("recentOrders", { fallback: "Recent Orders" })} ({orderItems.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1">
                                            <Archive className="w-4 h-4" /> {t("stockQuantity", { fallback: "Stock Quantity" })}
                                        </CardDescription>
                                        <CardTitle className="text-2xl flex items-baseline gap-2">
                                            {Number(detail.quantity)}
                                            <span className="text-sm font-normal text-muted-foreground">{detail.unit}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground">
                                            {t("minStock", { fallback: "Min Stock" })}: {detail.minStock ? Number(detail.minStock) : 0}
                                            {Number(detail.quantity) <= (detail.minStock ? Number(detail.minStock) : 0) && (
                                                <Badge variant="destructive" className="ml-2 text-[10px]">
                                                    {t("lowStock", { fallback: "Low Stock" })}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4" /> {t("sellingPrice", { fallback: "Selling Price" })}
                                        </CardDescription>
                                        <CardTitle className="text-2xl">
                                            {formatCurrency(Number(detail.price))}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground">
                                            {t("costPrice", { fallback: "Cost Price" })}: {detail.costPrice ? formatCurrency(Number(detail.costPrice)) : "-"}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-1">
                                            <BarChart2 className="w-4 h-4" /> {t("totalSales", { fallback: "Total Sales" })}
                                        </CardDescription>
                                        <CardTitle className="text-2xl">
                                            {orderItems.reduce((acc: number, item: OrderItemWithOrder) => acc + Number(item.quantity), 0)}
                                            <span className="text-sm font-normal text-muted-foreground ml-1">{detail.unit}</span>
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>

                            {detail.description && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">{t("description", { fallback: "Description" })}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="orders" className="pt-6">
                            <Card>
                                <CardContent className="p-0">
                                    {orderItems.length > 0 ? (
                                        <div className="divide-y">
                                            {orderItems.map((item: OrderItemWithOrder) => (
                                                <div key={item.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                                                    <div>
                                                        <div className="font-medium">
                                                            <Link href={`/finance/orders/${item.orderId}`} className="hover:underline">
                                                                {item.order?.orderNumber || "Order"}
                                                            </Link>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">
                                                            {Number(item.quantity)} {detail.unit} x {formatCurrency(Number(item.unitPrice))}
                                                        </div>
                                                        <Badge variant={item.order?.status === "COMPLETED" ? "default" : "secondary"}>
                                                            {item.order?.status || "UNKNOWN"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {t("noOrdersFound", { fallback: "No orders found for this product." })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
