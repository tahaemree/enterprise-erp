"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

import { transactionSchema, type TransactionFormValues } from "@/lib/validations/finance"
import { createTransaction, updateTransaction } from "@/lib/actions/transactions"

export function TransactionForm({ initialData }: { initialData?: any }) {
    const t = useTranslations("transactionForm")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
        defaultValues: {
            type: "INCOME",
            category: "",
            description: "",
            amount: 0,
            reference: "",
            date: new Date(),
        },
    })
    useEffect(() => { if (initialData) { form.reset(initialData) } }, [initialData, form])


    const watchType = form.watch("type")

    const categoryOptions: Record<string, string[]> = {
        INCOME: ["SALES", "SERVICE", "INVESTMENT", "INTEREST", "REFUND", "OTHER_INCOME"],
        EXPENSE: ["PURCHASE", "SALARY", "RENT", "UTILITIES", "MARKETING", "TRAVEL", "OFFICE", "MAINTENANCE", "TAX", "INSURANCE", "OTHER_EXPENSE"],
        REFUND: ["CUSTOMER_REFUND", "VENDOR_REFUND", "OTHER"],
        TRANSFER: ["BANK_TRANSFER", "INTERNAL", "OTHER"],
    }

    async function onSubmit(data: TransactionFormValues) {
        setIsSubmitting(true)
        try {
            await createTransaction({
                type: data.type,
                category: data.category || undefined,
                description: data.description,
                amount: data.amount,
                reference: data.reference || undefined,
                date: data.date,
            })
            toast.success(t("createSuccess"))
            router.push("/finance/transactions")
            router.refresh()
        } catch {
            toast.error(t("createError"))
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
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("type")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("selectType")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {["INCOME", "EXPENSE", "REFUND", "TRANSFER"].map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {t(`type_${type}`)}
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
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("category")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("selectCategory")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(categoryOptions[watchType] || []).map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {t(`category_${cat}`)}
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
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("amount")}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            className="pl-7"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("reference")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("referencePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("date")}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>{t("pickDate")}</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            autoFocus
                                        />
                                    </PopoverContent>
                                </Popover>
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
                        {isSubmitting ? t("creating") : t("createTransaction")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
