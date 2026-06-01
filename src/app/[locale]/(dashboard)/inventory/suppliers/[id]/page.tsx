import { getTenantPrisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Package, Phone, Mail, MapPin, Globe, Building2, CreditCard } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default async function SupplierDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    const user = await requireAuth()
    const db = getTenantPrisma(user.tenantId)
    const t = await getTranslations("suppliers")

    const supplier = await db.supplier.findUnique({
        where: { id: params.id },
        include: {
            products: true,
            supplierAccount: true
        }
    })

    if (!supplier) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {supplier.name}
                        {!supplier.isActive && (
                            <Badge variant="destructive">{t("inactive", { fallback: "Inactive" })}</Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4" />
                        {supplier.contactName ? `${supplier.contactName}` : t("noContact", { fallback: "No contact person" })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/inventory/suppliers/new?edit=${supplier.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit", { fallback: "Edit" })}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t("overview", { fallback: "Overview" })}</CardTitle>
                        <CardDescription>{t("contactInfo", { fallback: "Contact and company information" })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {t("email", { fallback: "Email" })}
                                </span>
                                <p>{supplier.email || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {t("phone", { fallback: "Phone" })}
                                </span>
                                <p>{supplier.phone || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    {t("website", { fallback: "Website" })}
                                </span>
                                <p>
                                    {supplier.website ? (
                                        <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {supplier.website}
                                        </a>
                                    ) : "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    {t("paymentTerms", { fallback: "Payment Terms" })}
                                </span>
                                <p>{supplier.paymentTerms || "-"}</p>
                            </div>
                        </div>

                        <div className="space-y-1 pt-4 border-t">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {t("address", { fallback: "Address" })}
                            </span>
                            <p>
                                {[supplier.address, supplier.city, supplier.state, supplier.country, supplier.postalCode]
                                    .filter(Boolean)
                                    .join(", ") || t("noAddress", { fallback: "No address provided" })}
                            </p>
                        </div>

                        {supplier.notes && (
                            <div className="space-y-1 pt-4 border-t">
                                <span className="text-sm font-medium text-muted-foreground">{t("notes", { fallback: "Notes" })}</span>
                                <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("financials", { fallback: "Financials" })}</CardTitle>
                            <CardDescription>{t("accountBalanceDesc", { fallback: "Financial summary for this supplier" })}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {supplier.supplierAccount ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">{t("currentBalance", { fallback: "Current Balance" })}</span>
                                        <span className={`font-bold ${Number(supplier.supplierAccount.currentBalance) > 0 ? "text-destructive" : ""}`}>
                                            {formatCurrency(supplier.supplierAccount.currentBalance as unknown as number, "TRY")}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("noFinancialAccount", { fallback: "No financial account linked." })}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                {t("products", { fallback: "Products" })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{supplier.products.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("suppliedProducts", { fallback: "Total products supplied" })}
                            </p>
                            {supplier.products.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {supplier.products.slice(0, 5).map(p => (
                                        <Link key={p.id} href={`/inventory/products/${p.id}`} className="block text-sm hover:underline">
                                            {p.name}
                                        </Link>
                                    ))}
                                    {supplier.products.length > 5 && (
                                        <p className="text-xs text-muted-foreground pt-2">
                                            + {supplier.products.length - 5} {t("more", { fallback: "more" })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
