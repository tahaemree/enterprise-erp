"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCustomerSchema, type CustomerFormValues } from "@/lib/validations/crm"

import { createCustomer } from "@/lib/actions/customers"
import { createLogger } from "@/lib/logger"

const logger = createLogger("customer-form")

const sourceOptions = [
    "DIRECT", "REFERRAL", "WEBSITE", "SOCIAL_MEDIA",
    "ADVERTISEMENT", "COLD_CALL", "TRADE_SHOW", "OTHER",
] as const

const statusOptions = [
    "LEAD", "QUALIFIED", "OPPORTUNITY", "PROPOSAL",
    "NEGOTIATION", "CUSTOMER", "CHURNED",
] as const

export function CustomerForm() {
    const t = useTranslations("customerForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(createCustomerSchema(tVal)) as Resolver<CustomerFormValues>,
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            company: "",
            jobTitle: "",
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            notes: "",
            source: "DIRECT",
            status: "LEAD",
            tags: [],
        },
    })

    async function onSubmit(data: CustomerFormValues) {
        setIsSubmitting(true)
        try {
            await createCustomer(data)
            toast.success(t("createSuccess"))
            router.push("/crm/customers")
            router.refresh()
        } catch (error) {
            logger.error("Error creating customer:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {Object.keys(form.formState.errors).length > 0 && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{tVal("formErrors") || "Lütfen formdaki hataları düzeltin."}</p>
                    </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("basicInfo")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("firstName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("firstNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("lastName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("lastNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("email")}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder={t("emailPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("phone")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("phonePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("company")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("companyPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="jobTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("jobTitle")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("jobTitlePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Address */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("address")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>{t("street")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("streetPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("city")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("cityPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("state")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("statePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("country")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("countryPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("postalCode")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("postalCodePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Classification */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("classification")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("source")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={cn(form.formState.errors.source && "border-destructive")}>
                                                <SelectValue placeholder={t("selectSource")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sourceOptions.map((source) => (
                                                <SelectItem key={source} value={source}>
                                                    {t(`source_${source}`)}
                                                </SelectItem>
                                            ))}
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
                                            <SelectTrigger className={cn(form.formState.errors.status && "border-destructive")}>
                                                <SelectValue placeholder={t("selectStatus")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {t(`status_${status}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

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
                        {isSubmitting ? t("creating") : t("createCustomer")}
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
