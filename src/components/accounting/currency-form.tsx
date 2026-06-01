"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
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
import { Switch } from "@/components/ui/switch"
import { createCurrency } from "@/lib/actions/tr-accounting"
import { currencySchema } from "@/lib/validations/tr-accounting"

type FormValues = z.infer<typeof currencySchema>

export function CurrencyForm() {
    const router = useRouter()
    const t = useTranslations("accounting.currencies.form")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<FormValues>({
        defaultValues: {
            code: "",
            name: "",
            symbol: "",
            isDefault: false,
        },
    })

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const parsed = currencySchema.safeParse(data)
            if (!parsed.success) {
                const msgs = parsed.error.issues.map(e => e.message).join(", ")
                toast.error(msgs)
                return
            }
            await createCurrency(parsed.data)
            toast.success(t('createSuccess'))
            router.push("/accounting/currencies")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('createError'))
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
                                <FormLabel>{t('code')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('codePlaceholder')}
                                        className="uppercase"
                                        maxLength={5}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {t('codeDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('symbol')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('symbolPlaceholder')}
                                        maxLength={5}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>{t('name')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('namePlaceholder')}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isDefault"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel>{t('isDefault')}</FormLabel>
                                    <FormDescription>
                                        {t('isDefaultDescription')}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value ?? false}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t('creating') : t('submit')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/accounting/currencies")}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
