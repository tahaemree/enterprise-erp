"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, Loader2 } from "lucide-react"

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
import { customerAccountSchema, type CustomerAccountFormValues } from "@/lib/validations/tr-accounting"
import { createCustomerAccount } from "@/lib/actions/tr-accounting"
import { getCustomers } from "@/lib/actions/customers"
import { toast } from "sonner"
import { createLogger } from "@/lib/logger"

const logger = createLogger("customer-account-form")

interface CustomerOption {
    id: string
    name: string
    company: string | null
}

export function CustomerAccountForm() {
    const router = useRouter()
    const t = useTranslations("accounting.customerAccounts.form")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customers, setCustomers] = useState<CustomerOption[]>([])
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

    useEffect(() => {
        async function fetchCustomers() {
            try {
                const data = await getCustomers()
                setCustomers(
                    data.map((c) => ({
                        id: c.id,
                        name: `${c.firstName} ${c.lastName}`,
                        company: c.company || null,
                    }))
                )
            } catch (error) {
                logger.error("Failed to load customers:", { error: String(error) })
            } finally {
                setIsLoadingCustomers(false)
            }
        }
        fetchCustomers()
    }, [])

    const form = useForm<CustomerAccountFormValues>({
        resolver: zodResolver(customerAccountSchema) as Resolver<CustomerAccountFormValues>,
        defaultValues: {
            accountCode: "",
            riskLimit: 0,
            creditLimit: undefined,
            paymentTerms: 30,
            notes: "",
        },
    })

    async function onSubmit(data: CustomerAccountFormValues) {
        if (!selectedCustomerId) {
            toast.error(t('selectCustomerError'))
            return
        }
        setIsSubmitting(true)
        try {
            await createCustomerAccount(selectedCustomerId, data)
            toast.success(t('createSuccess'))
            router.push("/accounting/customer-accounts")
            router.refresh()
        } catch (error) {
            logger.error("Error creating customer account:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t('createError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {t('title')}
                    </h3>
                    <Separator />

                    <FormField
                        control={form.control}
                        name="accountCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('accountCode')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('accountCodePlaceholder')} {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t('accountCodeDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem>
                        <FormLabel>{t('customer')}</FormLabel>
                        <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('customerPlaceholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingCustomers ? (
                                    <SelectItem value="loading" disabled>
                                        {t('loadingCustomers')}
                                    </SelectItem>
                                ) : customers.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        {t('noCustomers')}
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
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('financialSettings')}</h3>
                    <Separator />

                    <div className="grid gap-6 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="riskLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('riskLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('riskLimitDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="creditLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('creditLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="—"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('creditLimitDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paymentTerms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('paymentTerms')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="30"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('paymentTermsDescription')}
                                    </FormDescription>
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
                            <FormLabel>{t('notes')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('notesPlaceholder')}
                                    className="min-h-[100px]"
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
