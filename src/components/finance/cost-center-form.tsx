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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { costCenterSchema, type CostCenterFormValues } from "@/lib/validations/finance"
import { createCostCenter } from "@/lib/actions/cost-centers"
import { useTranslations } from "next-intl"

export function CostCenterForm() {
    const t = useTranslations("costCenterForm")
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(costCenterSchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
            isActive: true,
        },
    })

    async function onSubmit(data: CostCenterFormValues) {
        setIsPending(true)
        try {
            const result = await createCostCenter(data)
            if (result.ok) {
                toast.success(t("createSuccess"))
                router.push("/finance/cost-centers")
            } else {
                toast.error(result.error || t("createError"))
            }
        } catch (error: any) {
            toast.error(error.message || t("createError"))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("code")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("codePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
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
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>                                <FormLabel>{t("description")}</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder={t("descriptionPlaceholder")} 
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
