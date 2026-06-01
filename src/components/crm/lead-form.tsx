"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { z } from "zod"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { createLogger } from "@/lib/logger"

const logger = createLogger("lead-form")

const createLeadSchema = (t: (key: string, params?: Record<string, string | number>) => string) =>
    z.object({
        firstName: z.string().min(1, t("required")),
        lastName: z.string().min(1, t("required")),
        email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "ADVERTISEMENT", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"]).default("WEBSITE"),
        value: z.string().optional(),
        notes: z.string().optional(),
    })

type LeadFormValues = z.infer<ReturnType<typeof createLeadSchema>>

export function LeadForm() {
    const t = useTranslations("leadForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(createLeadSchema(tVal)) as Resolver<LeadFormValues>,
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            company: "",
            jobTitle: "",
            source: "WEBSITE",
            value: "",
            notes: "",
        },
    })

    async function onSubmit(data: LeadFormValues) {
        setIsSubmitting(true)
        try {
            logger.info("Creating lead", { data })
            await new Promise((resolve) => setTimeout(resolve, 800))
            toast.success(t("createSuccess"))
            router.push("/crm/pipeline")
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
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("firstName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("firstNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("lastName")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("lastNamePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("email")}</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder={t("emailPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("phone")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("phonePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("company")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("companyPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("jobTitle")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("jobTitlePlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("source")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("selectSource")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {["WEBSITE", "REFERRAL", "COLD_CALL", "ADVERTISEMENT", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"].map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {t(`source_${s}`)}
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
                        name="value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("value")}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{t("currencySymbol")}</span>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("notes")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("notesPlaceholder")}
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
                        {isSubmitting ? t("creating") : t("createLead")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
