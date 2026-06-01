"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

import { createCategorySchema, type CategoryFormValues } from "@/lib/validations/inventory"
import { createCategory } from "@/lib/actions/categories"
import { createLogger } from "@/lib/logger"

const logger = createLogger("category-form")

export function CategoryForm() {
    const t = useTranslations("categoryForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(createCategorySchema(tVal)),
        defaultValues: {
            name: "",
            description: "",
        },
    })

    async function onSubmit(data: CategoryFormValues) {
        setIsSubmitting(true)
        try {
            const result = await createCategory({ ...data, color: undefined })
            if (!result.ok) {
                toast.error(result.error || t("createError"))
                return
            }
            toast.success(t("createSuccess"))
            router.push("/inventory/categories")
            router.refresh()
        } catch (error) {
            logger.error("Error creating category:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
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

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("createCategory")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
