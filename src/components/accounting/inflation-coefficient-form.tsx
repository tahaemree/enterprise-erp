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
import { useTranslations } from "next-intl"
import { createInflationCoefficient } from "@/lib/actions/tr-accounting"
import { inflationCoefficientSchema } from "@/lib/validations/tr-accounting"

type FormValues = z.infer<typeof inflationCoefficientSchema>

export function InflationCoefficientForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const t = useTranslations("accounting.inflationCoefficients.form")

    const form = useForm<FormValues>({
        defaultValues: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            coefficient: 1.0,
            ppi: undefined,
            source: "",
            notes: "",
        },
    })

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const parsed = inflationCoefficientSchema.safeParse(data)
            if (!parsed.success) {
                const msgs = (parsed.error.issues as Array<{ message: string }>).map(e => e.message).join(", ")
                toast.error(msgs)
                return
            }
            await createInflationCoefficient(parsed.data)
            toast.success(t("createSuccess"))
            router.push("/accounting/inflation-coefficients")
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
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("year")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2100}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("month")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="coefficient"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("coefficient")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.00000001"
                                        min="1"
                                        placeholder="1.0"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>{t("coefficientDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ppi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("ppi")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Optional"
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            field.onChange(val ? Number(val) : undefined)
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>{t("ppiDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("source")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("sourcePlaceholder")} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                    className="resize-none"
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
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
                        onClick={() => router.push("/accounting/inflation-coefficients")}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
