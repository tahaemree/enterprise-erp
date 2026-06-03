"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Plus, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, generateOrderNumber } from "@/lib/utils"

import { orderSchema, type OrderFormValues } from "@/lib/validations/finance"
import { calculateOrderTotals } from "@/lib/order-totals"
import { getCustomers } from "@/lib/actions/customers"
import { getProducts } from "@/lib/actions/products"
import { createOrder} from "@/lib/actions/orders"
import { createLogger } from "@/lib/logger"

const logger = createLogger("order-form")

interface CustomerOption {
    id: string
    name: string
}

interface ProductOption {
    id: string
    name: string
    sku: string
    price: number
}

// initialData is a loosely-typed Order-like entity (e.g. a Prisma Order for
// edit/duplicate flows); form.reset tolerates extra fields.
export function OrderForm({ initialData }: { initialData?: Record<string, unknown> }) {
    const t = useTranslations("orderForm")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customers, setCustomers] = useState<CustomerOption[]>([])
    const [products, setProducts] = useState<ProductOption[]>([])
    const [isLoadingOptions, setIsLoadingOptions] = useState(true)

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [custs, prods] = await Promise.all([
                    getCustomers(),
                    getProducts(),
                ])
                setCustomers(custs.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })))
                setProducts(prods.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: Number(p.price) })))
            } catch (error) {
                logger.error("Failed to load options:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            } finally {
                setIsLoadingOptions(false)
            }
        }
        fetchOptions()
    }, [])

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema) as Resolver<OrderFormValues>,
        defaultValues: {
            customerId: "",
            orderNumber: generateOrderNumber("ORD"),
            status: "PENDING",
            items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0 }],
            taxRate: 20,
            discountType: "fixed",
            discountValue: 0,
            shippingAmount: 0,
            currency: "TRY",
            notes: "",
        },
    })
    useEffect(() => { if (initialData) { form.reset(initialData) } }, [initialData, form])


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    const watchItems = useWatch({ control: form.control, name: "items" }) ?? []
    const watchTaxRate = useWatch({ control: form.control, name: "taxRate" })
    const watchDiscountType = useWatch({ control: form.control, name: "discountType" })
    const watchDiscountValue = useWatch({ control: form.control, name: "discountValue" })
    const watchShipping = useWatch({ control: form.control, name: "shippingAmount" })

    const totals = calculateOrderTotals({
        items: (watchItems ?? []).map((i) => ({
            quantity: Number(i.quantity) || 0,
            unitPrice: Number(i.unitPrice) || 0,
        })),
        taxRate: Number(watchTaxRate) || 0,
        discountType: watchDiscountType ?? "fixed",
        discountValue: Number(watchDiscountValue) || 0,
        shippingAmount: Number(watchShipping) || 0,
    })

    function handleProductSelect(index: number, productId: string) {
        const product = products.find((p) => p.id === productId)
        if (product) {
            form.setValue(`items.${index}.productId`, product.id)
            form.setValue(`items.${index}.productName`, product.name)
            form.setValue(`items.${index}.unitPrice`, product.price)
        }
    }

    async function onSubmit(data: OrderFormValues) {
        setIsSubmitting(true)
        try {
            await createOrder({
                customerId: data.customerId,
                orderNumber: data.orderNumber,
                status: data.status,
                items: data.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                taxRate: data.taxRate,
                discountType: data.discountType,
                discountValue: data.discountValue,
                shippingAmount: data.shippingAmount,
                currency: data.currency,
                total: totals.total,
                notes: data.notes,
            })
            toast.success(t("createSuccess"))
            router.push("/finance/orders")
            router.refresh()
        } catch {
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t("orderDetails")}</h3>

                        <FormField
                            control={form.control}
                            name="orderNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("orderNumber")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} readOnly className="font-mono" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("customer")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectCustomer")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isLoadingOptions ? (
                                                <SelectItem value="loading" disabled>{t("loadingCustomers")}</SelectItem>
                                            ) : customers.length === 0 ? (
                                                <SelectItem value="none" disabled>{t("noCustomers")}</SelectItem>
                                            ) : (
                                                customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("status")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectStatus")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "ON_HOLD"].map((s) => (
                                                <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />
                        <h3 className="text-lg font-medium">{t("pricing")}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="taxRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("taxRate")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="shippingAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("shipping")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("discountType")}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fixed">{t("discountFixed")}</SelectItem>
                                                <SelectItem value="percentage">{t("discountPercentage")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("discountValue")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-lg font-semibold mb-4">{t("orderSummary")}</h3>
                        <Separator className="mb-4" />
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("itemsCount")}</span>
                                <span>{fields.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("subtotal")}</span>
                                <span>{formatCurrency(totals.subtotal)}</span>
                            </div>
                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                                    <span>{t("discount")}</span>
                                    <span>-{formatCurrency(totals.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("tax")} (%{Number(watchTaxRate) || 0})</span>
                                <span>{formatCurrency(totals.taxAmount)}</span>
                            </div>
                            {totals.shippingAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("shipping")}</span>
                                    <span>{formatCurrency(totals.shippingAmount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>{t("total")}</span>
                                <span>{formatCurrency(totals.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t("orderItems")}</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ productId: "", productName: "", quantity: 1, unitPrice: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("addItem")}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1fr_100px_120px_40px]">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t("product")}
                                            </FormLabel>
                                            <Select
                                                onValueChange={(value) => handleProductSelect(index, value)}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("selectProduct")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingOptions ? (
                                                        <SelectItem value="loading" disabled>{t("loadingProducts")}</SelectItem>
                                                    ) : products.length === 0 ? (
                                                        <SelectItem value="none" disabled>{t("noProducts")}</SelectItem>
                                                    ) : (
                                                        products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name} ({p.sku}) — {formatCurrency(p.price)}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t("qty")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t("unitPrice")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className={cn("flex items-end", index !== 0 && "pb-2")}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("notes")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("notesPlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("createOrder")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
