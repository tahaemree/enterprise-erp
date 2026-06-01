"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Loader2 } from "lucide-react"

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
import { useTranslations } from "next-intl"
import { supplierAccountSchema, type SupplierAccountFormValues } from "@/lib/validations/tr-accounting"
import { createSupplierAccount } from "@/lib/actions/tr-accounting"
import { getSuppliers } from "@/lib/actions/suppliers"
import { toast } from "sonner"
import { createLogger } from "@/lib/logger"

const logger = createLogger("supplier-account-form")

// Simplified supplier type for the form
interface SupplierOption {
    id: string
    name: string
    contactName: string | null
}

export function SupplierAccountForm() {
    const router = useRouter()
    const t = useTranslations("accounting.supplierAccounts.form")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")

    useEffect(() => {
        async function fetchSuppliers() {
            try {
                const data = await getSuppliers()
                setSuppliers(
                    data.map((s) => ({
                        id: s.id,
                        name: s.name,
                        contactName: s.contactName || null,
                    }))
                )
            } catch (error) {
                logger.error("Failed to load suppliers:", { error: String(error) })
            } finally {
                setIsLoadingSuppliers(false)
            }
        }
        fetchSuppliers()
    }, [])

    const form = useForm<SupplierAccountFormValues>({
        resolver: zodResolver(supplierAccountSchema) as Resolver<SupplierAccountFormValues>,
        defaultValues: {
            accountCode: "",
            riskLimit: 0,
            creditLimit: undefined,
            paymentTerms: 30,
            notes: "",
        },
    })

    async function onSubmit(data: SupplierAccountFormValues) {
        if (!selectedSupplierId) {
            toast.error(t('selectSupplierError'))
            return
        }
        setIsSubmitting(true)
        try {
            await createSupplierAccount(selectedSupplierId, data)
            toast.success(t('createSuccess'))
            router.push("/accounting/supplier-accounts")
            router.refresh()
        } catch (error) {
            logger.error("Error creating supplier account:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
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
                        <Building2 className="h-5 w-5" />
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
                        <FormLabel>{t('supplier')}</FormLabel>
                        <Select onValueChange={setSelectedSupplierId} value={selectedSupplierId}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('supplierPlaceholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingSuppliers ? (
                                    <SelectItem value="loading" disabled>
                                        {t('loadingSuppliers')}
                                    </SelectItem>
                                ) : suppliers.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        {t('noSuppliers')}
                                    </SelectItem>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            <div className="flex flex-col">
                                                <span>{supplier.name}</span>
                                                {supplier.contactName && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {supplier.contactName}
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
