"use client"

import { useState, useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

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

import { checkNoteSchema, type CheckNoteFormValues } from "@/lib/validations/finance"
import { createCheckNote} from "@/lib/actions/check-notes"
import { useTranslations } from "next-intl"

type CheckNoteInitialData = Record<string, unknown> & { id?: string }

export function CheckNoteForm({ initialData }: { initialData?: CheckNoteInitialData }) {
    const t = useTranslations("checkNoteForm")
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CheckNoteFormValues>({
        resolver: zodResolver(checkNoteSchema) as Resolver<CheckNoteFormValues>,
        defaultValues: {
            type: "CHECK",
            direction: "RECEIVED",
            serialNumber: "",
            bankName: "",
            bankBranch: "",
            accountNumber: "",
            issuerName: "",
            issuerTaxId: "",
            amount: 0,
            currency: "TRY",
            issueDate: new Date(),
            maturityDate: new Date(),
            status: "IN_PORTFOLIO",
            notes: "",
        },
    })
    useEffect(() => { if (initialData) { form.reset(initialData as CheckNoteFormValues) } }, [initialData, form])


    async function onSubmit(data: CheckNoteFormValues) {
        setIsPending(true)
        try {
            if (initialData?.id) {
                toast.info("Update logic pending backend implementation")
                router.push("/finance/check-notes")
            } else {
                const result = await createCheckNote(data)
                if (result.ok) {
                    toast.success(t("createSuccess"))
                    router.push("/finance/check-notes")
                } else {
                    toast.error(result.error || t("createError"))
                }
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : t("createError"))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("documentType")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("documentTypePlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CHECK">{t("typeCHECK")}</SelectItem>
                                        <SelectItem value="PROMISSORY_NOTE">{t("typePROMISSORY_NOTE")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("direction")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("directionPlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="RECEIVED">{t("directionRECEIVED")}</SelectItem>
                                        <SelectItem value="ISSUED">{t("directionISSUED")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("serialNumber")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("serialNumberPlaceholder")} {...field} />
                                </FormControl>
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
                                    <Input type="number" step="0.01" {...field} value={field.value as number} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                                        <SelectItem value="TRY">TRY</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
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
                        name="issueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("issueDate")}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="date" 
                                        value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => field.onChange(new Date(e.target.value))} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maturityDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("maturityDate")}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="date" 
                                        value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => field.onChange(new Date(e.target.value))} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
                    <FormField
                        control={form.control}
                        name="issuerName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("issuerName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("issuerNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="issuerTaxId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("issuerTaxId")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("issuerTaxIdPlaceholder")} {...field} />
                                </FormControl>
                                <FormDescription>{t("issuerTaxIdDescription")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
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
                        name="bankBranch"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("branch")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("branchPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("accountNo")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("accountNoPlaceholder")} {...field} />
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

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isPending}
                    >
                        {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("save")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
