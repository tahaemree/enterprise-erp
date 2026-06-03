"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { createTaxType } from "@/lib/actions/tr-accounting"
import { taxTypeSchema } from "@/lib/validations/tr-accounting"

type FormValues = z.infer<typeof taxTypeSchema>

export function TaxTypeForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const t = useTranslations("accounting.taxTypes.form")

    const form = useForm<FormValues>({
        defaultValues: {
            code: "",
            name: "",
            rate: 0,
            category: "VAT",
            description: "",
        },
    })

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const parsed = taxTypeSchema.safeParse(data)
            if (!parsed.success) {
                const msgs = (parsed.error.issues as Array<{ message: string }>).map(e => e.message).join(", ")
                toast.error(msgs)
                return
            }
            await createTaxType(parsed.data)
            toast.success(t("createSuccess"))
            router.push("/accounting/tax-types")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("createError"))
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
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("code")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("codePlaceholder")} {...field} />
                                </FormControl>
                                <FormDescription>{t("codeDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("rate")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="18"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>{t("rateDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
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
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("category")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("categoryPlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="VAT">KDV (Katma Değer Vergisi)</SelectItem>
                                        <SelectItem value="WITHHOLDING">Tevkifat</SelectItem>
                                        <SelectItem value="STOPAJ">Stopaj</SelectItem>
                                        <SelectItem value="SPECIAL">Özel Vergi</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>{t("categoryDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("description")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("descriptionPlaceholder")}
                                    className="resize-none"
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
                        onClick={() => router.push("/accounting/tax-types")}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
