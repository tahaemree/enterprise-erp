import { notFound } from "next/navigation"
import { getCustomer } from "@/lib/actions/customers"
import { getTranslations } from "next-intl/server"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Building, MapPin, Edit, Calendar } from "lucide-react"
import Link from "next/link"

export default async function CustomerDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const t = await getTranslations("customers")
    const customer = await getCustomer(params.id)

    if (!customer) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {customer.firstName} {customer.lastName}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Badge variant="outline">{customer.status}</Badge>
                        <Badge variant="secondary">{customer.source}</Badge>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/crm/customers/new?edit=${customer.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>{t("contactInfo", { fallback: "Contact Information" })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        {customer.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{customer.email}</span>
                            </div>
                        )}
                        {customer.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        {customer.company && (
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span>{customer.company}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>
                                {[customer.city, customer.state, customer.country].filter(Boolean).join(", ") || t("noAddress", { fallback: "No address provided" })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{t("customerSince", { fallback: "Customer Since" })}: {formatDate(customer.createdAt)}</span>
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
                                {t("orders", { fallback: "Orders" })} ({customer.orders?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="financials" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3">
                                {t("financials", { fallback: "Financials" })}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>{t("totalSpent", { fallback: "Total Spent" })}</CardDescription>
                                        <CardTitle className="text-2xl">{formatCurrency(customer.totalSpent as unknown as number)}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>{t("orderCount", { fallback: "Order Count" })}</CardDescription>
                                        <CardTitle className="text-2xl">{customer.orderCount}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>{t("leadScore", { fallback: "Lead Score" })}</CardDescription>
                                        <CardTitle className="text-2xl">{customer.leadScore}</CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>

                            {customer.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">{t("notes", { fallback: "Notes" })}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="orders" className="pt-6">
                            <Card>
                                <CardContent className="p-0">
                                    {customer.orders && customer.orders.length > 0 ? (
                                        <div className="divide-y">
                                            {customer.orders.map((order) => (
                                                <div key={order.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                                                    <div>
                                                        <div className="font-medium">
                                                            <Link href={`/finance/orders/${order.id}`} className="hover:underline">
                                                                {order.orderNumber}
                                                            </Link>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">{formatCurrency(Number(order.total), order.currency)}</div>
                                                        <Badge variant={order.status === "COMPLETED" ? "default" : "secondary"}>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {t("noOrders", { fallback: "No orders found." })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="financials" className="pt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("currentBalance", { fallback: "Current Balance" })}</CardTitle>
                                    <CardDescription>{t("accountBalanceDesc", { fallback: "Financial summary for this customer" })}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {customer.customerAccount ? (
                                        <div className="text-3xl font-bold">
                                            {formatCurrency(customer.customerAccount.currentBalance as unknown as number)}
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground">
                                            {t("noFinancialAccount", { fallback: "No financial account linked." })}
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
