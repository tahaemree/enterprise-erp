"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { bankAccountSchema, type BankAccountFormValues } from "@/lib/validations/finance"
import { createBankAccount, updateBankAccount } from "@/lib/actions/bank-accounts"
import { createLogger } from "@/lib/logger"
import { useTranslations } from "next-intl"

const logger = createLogger("BankAccountForm")

interface BankAccountFormProps {
    initialData?: Partial<BankAccountFormValues> & { id?: string };
}

export function BankAccountForm({ initialData }: BankAccountFormProps) {
    const t = useTranslations("bankAccountForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            bankName: initialData?.bankName || "",
            branchName: initialData?.branchName || "",
            branchCode: initialData?.branchCode || "",
            accountNumber: initialData?.accountNumber || "",
            iban: initialData?.iban || "",
            accountType: initialData?.accountType || "CHECKING",
            currency: initialData?.currency || "TRY",
            description: initialData?.description || "",
            isActive: initialData?.isActive ?? true,
        },
    })

    async function onSubmit(data: BankAccountFormValues) {
        setIsSubmitting(true)
        try {
            if (initialData?.id) {
                await updateBankAccount(initialData.id, data)
                toast.success(t("updateSuccess", { fallback: "Bank account updated successfully" }))
            } else {
                await createBankAccount(data)
                toast.success(t("createSuccess", { fallback: "Bank account created successfully" }))
            }
            router.push("/finance/bank-accounts")
            router.refresh()
        } catch (error) {
            logger.error("Error saving bank account:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(initialData?.id ? t("updateError", { fallback: "Failed to update account" }) : t("createError", { fallback: "Failed to create account" }))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("bankName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("bankNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("accountType")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("accountTypePlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CHECKING">{t("accountTypeCHECKING")}</SelectItem>
                                        <SelectItem value="SAVINGS">{t("accountTypeSAVINGS")}</SelectItem>
                                        <SelectItem value="CREDIT_CARD">{t("accountTypeCREDIT_CARD")}</SelectItem>
                                        <SelectItem value="POS">{t("accountTypePOS")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="branchName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("branchName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("branchNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="branchCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("branchCode")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("branchCodePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("accountNumber")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("accountNumberPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("iban")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("ibanPlaceholder")} {...field} />
                                </FormControl>
                                <FormDescription>{t("ibanDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("currency")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("currencyPlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TRY">TRY - Turkish Lira</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>                                <FormLabel>{t("notes")}</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder={t("notesPlaceholder")} 
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    {t("isActive")}
                                </FormLabel>
                                <FormDescription>
                                    {t("isActiveDescription")}
                                </FormDescription>
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
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("saving", { fallback: "Saving..." }) : (initialData?.id ? t("updateAccount", { fallback: "Update Account" }) : t("createAccount", { fallback: "Create Account" }))}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
