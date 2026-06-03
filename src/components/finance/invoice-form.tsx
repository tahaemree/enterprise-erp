"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus, Trash2, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, generateOrderNumber } from "@/lib/utils"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/finance"

import { getCustomers } from "@/lib/actions/customers"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { createLogger } from "@/lib/logger"

const logger = createLogger("invoice-form")

interface CustomerOption {
    id: string
    name: string
    company: string | null
    email: string | null
}

export function InvoiceForm() {
    const t = useTranslations("invoiceForm")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customers, setCustomers] = useState<CustomerOption[]>([])
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
    const [defaultInvoiceNumber] = useState(() => generateOrderNumber("INV"))
    const [defaultDueDate] = useState(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

    useEffect(() => {
        async function fetchCustomers() {
            try {
                const data = await getCustomers()
                setCustomers(
                    data.map((c) => ({
                        id: c.id,
                        name: `${c.firstName} ${c.lastName}`,
                        company: c.company || null,
                        email: c.email || null,
                    }))
                )
            } catch (error) {
                logger.error("Failed to load customers:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            } finally {
                setIsLoadingCustomers(false)
            }
        }
        fetchCustomers()
    }, [])

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema) as Resolver<InvoiceFormData>,
        defaultValues: {
            customerId: "",
            invoiceNumber: defaultInvoiceNumber,
            dueDate: defaultDueDate,
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
            notes: "",
            taxRate: 15,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    const watchItems = useWatch({ control: form.control, name: "items" }) ?? []
    const watchTaxRate = useWatch({ control: form.control, name: "taxRate" }) ?? 0

    const subtotal = watchItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
    )
    const tax = subtotal * (watchTaxRate / 100)
    const total = subtotal + tax

    async function onSubmit(data: InvoiceFormData) {
        setIsSubmitting(true)
        try {
            logger.info("Invoice data", { data, subtotal, tax, total })

            // In production, this would call a createInvoice server action
            await new Promise((resolve) => setTimeout(resolve, 1000))

            toast.success(t("createSuccess"))
            router.push("/finance/invoices")
            router.refresh()
        } catch (error) {
            logger.error("Error creating invoice:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Invoice Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t("invoiceDetails")}</h3>

                        <FormField
                            control={form.control}
                            name="invoiceNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("invoiceNumber")}</FormLabel>
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
                                            {isLoadingCustomers ? (
                                                <SelectItem value="loading" disabled>
                                                    {t("loadingCustomers")}
                                                </SelectItem>
                                            ) : customers.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    {t("noCustomers")}
                                                </SelectItem>
                                            ) : (
                                                customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id}>
                                                        <div className="flex flex-col">
                                                            <span>{customer.name}</span>
                                                            {customer.company && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {customer.company}
                                                                </span>
                                                            )}
                                                        </div>
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
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t("dueDate")}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>{t("pickDate")}</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date()}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                            step="0.5"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Invoice Preview */}
                    <div className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5" />
                            {t("invoicePreview")}
                        </div>
                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("subtotal")}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("tax", {rate: watchTaxRate})}</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>{t("total")}</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t("lineItems")}</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("addItem")}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1fr_100px_120px_40px]"
                            >
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t("description")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("itemDescriptionPlaceholder")} {...field} />
                                            </FormControl>
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
                                <Textarea
                                    placeholder={t("notesPlaceholder")}
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("createInvoice")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
