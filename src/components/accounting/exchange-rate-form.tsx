"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useForm, useWatch } from "react-hook-form"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createExchangeRate, getCurrencies } from "@/lib/actions/tr-accounting"
import { exchangeRateSchema } from "@/lib/validations/tr-accounting"

type FormValues = z.infer<typeof exchangeRateSchema>

interface CurrencyOption {
    id: string
    code: string
    name: string
    symbol: string
}

export function ExchangeRateForm() {
    const router = useRouter()
    const t = useTranslations("accounting.exchangeRates.form")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)

    useEffect(() => {
        void getCurrencies().then((data) => {
            setCurrencies(data as CurrencyOption[])
        }).catch(() => {
            toast.error(t('loadCurrenciesError'))
        }).finally(() => {
            setIsLoadingCurrencies(false)
        })
    }, [t])

    const form = useForm<FormValues>({
        defaultValues: {
            fromCurrencyId: "",
            toCurrencyId: "",
            rate: 0,
            date: new Date(),
            source: "MANUAL",
        },
    })

    const selectedFromCurrency = useWatch({ control: form.control, name: "fromCurrencyId" })
    const filteredToCurrencies = currencies.filter((c) => c.id !== selectedFromCurrency)

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const parsed = exchangeRateSchema.safeParse(data)
            if (!parsed.success) {
                const msgs = parsed.error.issues.map(e => e.message).join(", ")
                toast.error(msgs)
                return
            }
            await createExchangeRate(parsed.data)
            toast.success(t('createSuccess'))
            router.push("/accounting/exchange-rates")
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
                        name="fromCurrencyId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('fromCurrency')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCurrencies ? t('loading') : t('fromPlaceholder')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.code} — {c.name} ({c.symbol})
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
                        name="toCurrencyId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('toCurrency')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCurrencies ? t('loading') : t('toPlaceholder')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredToCurrencies.length === 0 ? (
                                            <SelectItem value="_none" disabled>
                                                {t('selectSourceFirst')}
                                            </SelectItem>
                                        ) : (
                                            filteredToCurrencies.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.code} — {c.name} ({c.symbol})
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
                        name="rate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('rate')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        min="0"
                                        placeholder="1.000000"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {t('rateDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('date')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                                        onChange={(e) => field.onChange(new Date(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
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
                        onClick={() => router.push("/accounting/exchange-rates")}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
