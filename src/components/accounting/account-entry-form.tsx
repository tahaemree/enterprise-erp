"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { CalendarIcon, Plus, Trash2, FileText, ArrowRightLeft, Loader2 } from "lucide-react"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"
import { accountEntrySchema, type AccountEntryFormValues } from "@/lib/validations/tr-accounting"
import { createAccountEntry } from "@/lib/actions/tr-accounting"
import { toast } from "sonner"
import { createLogger } from "@/lib/logger"

const logger = createLogger("account-entry-form")

const entryTypeOptions = [
    { value: "DEBIT_NOTE", labelKey: "entryTypeDebitNote" },
    { value: "CREDIT_NOTE", labelKey: "entryTypeCreditNote" },
    { value: "OPENING", labelKey: "entryTypeOpening" },
    { value: "CLOSING", labelKey: "entryTypeClosing" },
    { value: "TRANSFER", labelKey: "entryTypeTransfer" },
    { value: "CORRECTION", labelKey: "entryTypeCorrection" },
] as const

export function AccountEntryForm({ initialData }: { initialData?: any }) {
    const router = useRouter()
    const t = useTranslations("accounting.accountEntries.form")
    const tc = useTranslations("accounting.accountEntries.columns")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<AccountEntryFormValues>({
        resolver: zodResolver(accountEntrySchema) as Resolver<AccountEntryFormValues>,
        defaultValues: {
            entryType: "DEBIT_NOTE",
            description: "",
            entryDate: new Date(),
            lines: [
                { side: "DEBIT", amount: 0, description: "" },
                { side: "CREDIT", amount: 0, description: "" },
            ],
        },
    })
    useEffect(() => { if (initialData) { form.reset(initialData) } }, [initialData, form])


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines",
    })

    const watchLines = form.watch("lines")

    const debitTotal = watchLines
        .filter((l) => l.side === "DEBIT")
        .reduce((sum, l) => sum + (l.amount || 0), 0)
    const creditTotal = watchLines
        .filter((l) => l.side === "CREDIT")
        .reduce((sum, l) => sum + (l.amount || 0), 0)
    const isBalanced = Math.abs(debitTotal - creditTotal) < 0.01

    function addLine() {
        append({ side: "DEBIT", amount: 0, description: "" })
    }

    async function onSubmit(data: AccountEntryFormValues) {
        if (!isBalanced) {
            toast.error(t('balanceError'))
            return
        }
        setIsSubmitting(true)
        try {
            if (initialData?.id) {
                toast.error(t('updateNotImplemented', { fallback: "Update action is not implemented yet" }))
                setIsSubmitting(false)
                return
            } else {
                await createAccountEntry(data)
            }
            toast.success(t('createSuccess'))
            router.push("/accounting/entries")
            router.refresh()
        } catch (error) {
            logger.error("Error creating account entry:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t('createError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('entryDetails')}
                        </h3>
                        <Separator />

                        <FormField
                            control={form.control}
                            name="entryType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('entryType')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('entryTypePlaceholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {entryTypeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {t(opt.labelKey)}
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
                            name="entryDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t('entryDate')}</FormLabel>
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
                                                        <span>{t('pickDate')}</span>
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('description')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('descriptionPlaceholder')}
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Balance Preview */}
                    <div className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <ArrowRightLeft className="h-5 w-5" />
                            {t('entryBalance')}
                        </div>
                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('totalDebit')}</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(debitTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('totalCredit')}</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {formatCurrency(creditTotal)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-base font-semibold">
                                <span>{t('difference')}</span>
                                <span className={isBalanced ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                    {isBalanced ? t('balanced') : formatCurrency(Math.abs(debitTotal - creditTotal))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lines */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t('accountLines')}</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLine}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addLine')}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid gap-4 rounded-lg border p-4 md:grid-cols-[140px_140px_1fr_40px]"
                            >
                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.side`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t('lineSide')}
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DEBIT">
                                                        <span className="text-red-600 dark:text-red-400">{t('debit')}</span>
                                                    </SelectItem>
                                                    <SelectItem value="CREDIT">
                                                        <span className="text-green-600 dark:text-green-400">{t('credit')}</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.amount`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t('lineAmount')}
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

                                <FormField
                                    control={form.control}
                                    name={`lines.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                                {t('lineDescription')}
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('lineDescriptionPlaceholder')} {...field} value={field.value ?? ""} />
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
                                        disabled={fields.length <= 2}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting || !isBalanced}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t('creating') : t('submit')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t('cancel')}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
