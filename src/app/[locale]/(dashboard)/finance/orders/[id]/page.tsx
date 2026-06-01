import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ShoppingCart, Calendar, MapPin, Hash, User } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function OrderDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("orders")

    const order = await db.order.findUnique({
        where: { id: params.id },
        include: {
            customer: true,
            items: {
                include: {
                    product: true
                }
            }
        }
    })

    if (!order) {
        notFound()
    }

    const statusColors = {
        PENDING: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        PROCESSING: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
        COMPLETED: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        CANCELLED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {order.orderNumber}
                        </h1>
                        <Badge className={statusColors[order.status as keyof typeof statusColors]} variant="secondary">
                            {t(`status.${order.status}`, { fallback: order.status })}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/finance/orders/new?edit=${order.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            {t("orderItems", { fallback: "Order Items" })}
                        </CardTitle>
                        <CardDescription>{t("itemsDesc", { fallback: "Products included in this order" })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="p-3 text-left font-medium">{t("product", { fallback: "Product" })}</th>
                                        <th className="p-3 text-right font-medium">{t("quantity", { fallback: "Quantity" })}</th>
                                        <th className="p-3 text-right font-medium">{t("unitPrice", { fallback: "Unit Price" })}</th>
                                        <th className="p-3 text-right font-medium">{t("discount", { fallback: "Discount" })}</th>
                                        <th className="p-3 text-right font-medium">{t("taxRate", { fallback: "Tax %" })}</th>
                                        <th className="p-3 text-right font-medium">{t("total", { fallback: "Total" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30">
                                            <td className="p-3">
                                                {item.product ? (
                                                    <Link href={`/inventory/products/${item.productId}`} className="font-medium hover:underline text-primary">
                                                        {item.product.name}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">{item.productName || t("unknownProduct", { fallback: "Unknown Product" })}</span>
                                                )}
                                            </td>
                                        <td className="p-3 text-right">{item.quantity as unknown as number}</td>
                                        <td className="p-3 text-right">{formatCurrency(item.unitPrice as unknown as number)}</td>
                                        <td className="p-3 text-right">{Number(item.discount) > 0 ? formatCurrency(item.discount as unknown as number) : '-'}</td>
                                        <td className="p-3 text-right">%{item.taxRate as unknown as number}</td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(item.total as unknown as number)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/50 border-t font-semibold">
                                <tr>
                                    <td colSpan={5} className="p-3 text-right">{t("subtotal", { fallback: "Subtotal" })}:</td>
                                    <td className="p-3 text-right">{formatCurrency(order.subtotal as unknown as number)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={5} className="p-3 text-right">{t("totalTax", { fallback: "Total Tax" })}:</td>
                                    <td className="p-3 text-right">{formatCurrency(order.taxAmount as unknown as number)}</td>
                                </tr>
                                {Number(order.discountAmount) > 0 && (
                                    <tr className="text-destructive">
                                        <td colSpan={5} className="p-3 text-right">{t("totalDiscount", { fallback: "Total Discount" })}:</td>
                                        <td className="p-3 text-right">-{formatCurrency(order.discountAmount as unknown as number)}</td>
                                    </tr>
                                )}
                                <tr className="text-lg">
                                    <td colSpan={5} className="p-3 text-right">{t("grandTotal", { fallback: "Grand Total" })}:</td>
                                    <td className="p-3 text-right text-primary">{formatCurrency(order.total as unknown as number)}</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>

                        {order.notes && (
                            <div className="mt-6 p-4 rounded-md bg-muted/30 border">
                                <h4 className="font-medium mb-2">{t("notes", { fallback: "Notes" })}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                {t("customerDetails", { fallback: "Customer Details" })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.customer ? (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t("name", { fallback: "Name" })}</p>
                                        <Link href={`/crm/customers/${order.customer.id}`} className="font-medium hover:underline text-primary">
                                            {order.customer.firstName} {order.customer.lastName}
                                        </Link>
                                    </div>
                                    {order.customer.email && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{t("email", { fallback: "Email" })}</p>
                                            <p className="text-sm">{order.customer.email}</p>
                                        </div>
                                    )}
                                    {order.customer.phone && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{t("phone", { fallback: "Phone" })}</p>
                                            <p className="text-sm">{order.customer.phone}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("noCustomer", { fallback: "No customer linked" })}</p>
                            )}
                        </CardContent>
                    </Card>

                    {(order.shippingAddress || order.billingAddress) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    {t("addresses", { fallback: "Addresses" })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.shippingAddress && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{t("shippingAddress", { fallback: "Shipping Address" })}</p>
                                        <p className="text-sm whitespace-pre-wrap">{order.shippingAddress}</p>
                                    </div>
                                )}
                                {order.billingAddress && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{t("billingAddress", { fallback: "Billing Address" })}</p>
                                        <p className="text-sm whitespace-pre-wrap">{order.billingAddress}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
