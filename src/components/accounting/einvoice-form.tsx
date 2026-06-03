"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileDigit, FileArchive, Truck, Calculator, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { eInvoiceSchema, type EInvoiceFormValues } from "@/lib/validations/tr-accounting"
import { createEInvoice } from "@/lib/actions/tr-accounting"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { createLogger } from "@/lib/logger"

const logger = createLogger("einvoice-form")

interface EInvoiceFormProps {
    defaultType?: "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE"
}

export function EInvoiceForm({ defaultType = "INVOICE" }: EInvoiceFormProps) {
    const router = useRouter()
    const t = useTranslations("accounting.einvoice.form")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [docType, setDocType] = useState<string>(defaultType)

    const form = useForm<EInvoiceFormValues>({
        resolver: zodResolver(eInvoiceSchema) as Resolver<EInvoiceFormValues>,
        defaultValues: {
            documentType: defaultType,
            profile: defaultType === "ARCHIVE" ? "EARSIVFATURA" : "TEMELFATURA",
            orderId: "",
            receiverTaxId: "",
            receiverName: "",
            receiverEmail: "",
            grossTotal: 0,
            vatBaseTotal: 0,
            vatTotal: 0,
            netTotal: 0,
            withholdingTotal: 0,
            currency: "TRY",
            exchangeRate: undefined,
            issueDate: new Date(),
            dueDate: undefined,
            notes: "",
        },
    })

    // Calculate totals helper
    function calculateFromGross() {
        const gross = form.getValues("grossTotal") || 0
        const vatRate = 0.20 // %20 varsayılan KDV
        const vatBase = gross / (1 + vatRate)
        const vat = gross - vatBase

        form.setValue("vatBaseTotal", Math.round(vatBase * 100) / 100)
        form.setValue("vatTotal", Math.round(vat * 100) / 100)
        form.setValue("netTotal", gross)
    }

    async function onSubmit(data: EInvoiceFormValues) {
        setIsSubmitting(true)
        try {
            await createEInvoice(data)
            toast.success(t("createSuccess"))
            router.push("/accounting/e-invoice")
            router.refresh()
        } catch (error) {
            logger.error("Error creating e-invoice:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue={docType} onValueChange={(v) => { setDocType(v); form.setValue("documentType", v as "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE") }}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="INVOICE">
                            <FileDigit className="mr-2 h-4 w-4" />
                            e-Fatura
                        </TabsTrigger>
                        <TabsTrigger value="ARCHIVE">
                            <FileArchive className="mr-2 h-4 w-4" />
                            e-Arşiv
                        </TabsTrigger>
                        <TabsTrigger value="DESPATCH_ADVICE">
                            <Truck className="mr-2 h-4 w-4" />
                            e-İrsaliye
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="INVOICE" className="space-y-6 pt-4">
                        <p className="text-sm text-muted-foreground">{t("tabInvoiceDesc")}</p>
                    </TabsContent>
                    <TabsContent value="ARCHIVE" className="space-y-6 pt-4">
                        <p className="text-sm text-muted-foreground">{t("tabArchiveDesc")}</p>
                    </TabsContent>
                    <TabsContent value="DESPATCH_ADVICE" className="space-y-6 pt-4">
                        <p className="text-sm text-muted-foreground">{t("tabDespatchDesc")}</p>
                    </TabsContent>
                </Tabs>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileDigit className="h-5 w-5" />
                        {t("receiverInfo")}
                    </h3>
                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="receiverName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("receiverName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("receiverNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="receiverTaxId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("receiverTaxId")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="receiverEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("receiverEmail")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder={t("receiverEmailPlaceholder")}
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="profile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("profile")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectProfile")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TEMELFATURA">{t("profileTemel")}</SelectItem>
                                            <SelectItem value="TICARIFATURA">{t("profileTicari")}</SelectItem>
                                            <SelectItem value="EARSIVFATURA">{t("profileEArsiv")}</SelectItem>
                                            <SelectItem value="IHRACAT">{t("profileIhracat")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        {t("financialDetails")}
                    </h3>
                    <Separator />

                    <div className="grid gap-6 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="grossTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("grossTotal")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(parseFloat(e.target.value) || 0)
                                                calculateFromGross()
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vatBaseTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("vatBase")}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vatTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("vatTotal")}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="netTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("netTotal")}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="withholdingTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("withholdingTotal")}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormDescription>{t("withholdingHint")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("currency")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("selectCurrency")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TRY">₺ TRY</SelectItem>
                                            <SelectItem value="USD">$ USD</SelectItem>
                                            <SelectItem value="EUR">€ EUR</SelectItem>
                                            <SelectItem value="GBP">£ GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="issueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("issueDate")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                                            onChange={(e) => field.onChange(new Date(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("dueDate")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="exchangeRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("exchangeRate")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            placeholder="1.0000"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormDescription>{t("exchangeRateHint")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("notes")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("notesPlaceholder")}
                                    className="min-h-[80px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("submit")}
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
