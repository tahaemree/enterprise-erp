"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"

import { createSupplierSchema, type SupplierFormValues } from "@/lib/validations/inventory"
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers"
import { createLogger } from "@/lib/logger"

const logger = createLogger("supplier-form")

interface SupplierFormProps {
    initialData?: Partial<SupplierFormValues> & { id?: string };
}

export function SupplierForm({ initialData }: SupplierFormProps) {
    const t = useTranslations("supplierForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(createSupplierSchema(tVal)),
        defaultValues: {
            name: initialData?.name || "",
            contactName: initialData?.contactName || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            city: initialData?.city || "",
            country: initialData?.country || "",
            isActive: initialData?.isActive ?? true,
        },
    })

    async function onSubmit(data: SupplierFormValues) {
        setIsSubmitting(true)
        try {
            if (initialData?.id) {
                await updateSupplier({ id: initialData.id, ...data })
                toast.success(t("updateSuccess", { fallback: "Supplier updated successfully" }))
            } else {
                await createSupplier(data)
                toast.success(t("createSuccess"))
            }
            router.push("/inventory/suppliers")
            router.refresh()
        } catch (error) {
            logger.error("Error saving supplier:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(initialData?.id ? t("updateError", { fallback: "Failed to update supplier" }) : t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>{t("name")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("namePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("contactName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("contactNamePlaceholder")} {...field} />
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
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("address")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("addressPlaceholder")}
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>{t("active")}</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("saving", { fallback: "Saving..." }) : (initialData?.id ? t("updateSupplier", { fallback: "Update Supplier" }) : t("createSupplier"))}
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
