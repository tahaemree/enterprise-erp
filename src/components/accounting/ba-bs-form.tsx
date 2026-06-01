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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { generateBaBsFormAction } from "@/lib/actions/tr-accounting"
import { formatCurrency } from "@/lib/utils"

const formSchema = z.object({
    formType: z.enum(["BA", "BS"]),
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
})

type FormValues = z.infer<typeof formSchema>

export function BaBsForm() {
    const router = useRouter()
    const t = useTranslations("accounting.baBs.form")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{
        totalDocuments: number
        totalAmount: number
        items: Array<{ taxId: string; name: string; documentCount: number; totalAmount: number }>
    } | null>(null)

    const form = useForm<FormValues>({
        defaultValues: {
            formType: "BS",
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
        },
    })

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            const parsed = formSchema.safeParse(data)
            if (!parsed.success) {
                const msgs = parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
                toast.error(msgs)
                return
            }
            const res = await generateBaBsFormAction(parsed.data.formType, parsed.data.year, parsed.data.month)
            if (!res.ok) {
                toast.error(res.error || t('generateError'))
                return
            }
            setResult({
                totalDocuments: res.data.generationResult.summary.totalDocuments,
                totalAmount: res.data.generationResult.summary.totalAmount,
                items: res.data.generationResult.items,
            })
            toast.success(t('generateSuccess', { count: res.data.generationResult.items.length }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('generateError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="formType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('formType')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('formTypePlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BS">BS — Mal ve Hizmet Satış Bildirimi</SelectItem>
                                                <SelectItem value="BA">BA — Mal ve Hizmet Alış Bildirimi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {t('formTypeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('year')}</FormLabel>
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
                                            <FormLabel>{t('month')}</FormLabel>
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
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? t('generating') : t('submit')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('result')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Belge</span>
                                <span className="font-bold">{result.totalDocuments}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Tutar</span>
                                <span className="font-bold font-mono">
                                    {formatCurrency(result.totalAmount, "TRY", "tr-TR")}
                                </span>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">{t('items', { count: result.items.length })}</h4>
                                <div className="max-h-60 space-y-2 overflow-y-auto">
                                    {result.items.map((item, i) => (
                                        <div key={i} className="rounded-lg border p-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{item.name}</span>
                                                <Badge variant="outline">{item.taxId}</Badge>
                                            </div>
                                            <div className="mt-1 flex justify-between text-muted-foreground">
                                                <span>{item.documentCount} belge</span>
                                                <span className="font-mono">
                                                    {formatCurrency(item.totalAmount, "TRY", "tr-TR")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push("/accounting/ba-bs")}
                            >
                                {t('viewAll')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center text-muted-foreground">
                            <p>{t('placeholder')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
