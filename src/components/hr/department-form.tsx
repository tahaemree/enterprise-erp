"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
import { createDepartmentSchema, type DepartmentFormData } from "@/lib/validations/hr"
import { createDepartment, updateDepartment } from "@/lib/actions/departments"

export function DepartmentForm({ initialData }: { initialData?: any }) {
    const t = useTranslations("departmentForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<DepartmentFormData>({
        resolver: zodResolver(createDepartmentSchema(tVal)) as Resolver<DepartmentFormData>,
        defaultValues: {
            name: "",
            description: "",
            budget: undefined,
        },
    })
    useEffect(() => { if (initialData) { form.reset(initialData) } }, [initialData, form])


    async function onSubmit(data: DepartmentFormData) {
        setIsSubmitting(true)
        try {
            await createDepartment({
                ...data,
                budget: data.budget ? Number(data.budget) : undefined,
            })
            toast.success(t("createSuccess"))
            router.push("/hr/departments")
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
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("name")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("namePlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("description")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("descriptionPlaceholder")}
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("budget")}</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{t("currencySymbol")}</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-7"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        value={field.value ?? ""}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("createDepartment")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
