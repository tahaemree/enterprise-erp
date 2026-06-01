"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
import { updateProfile } from "@/lib/actions/users"
import { useTranslations } from "next-intl"

const profileSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm({ defaultValues }: { defaultValues: { name: string, email: string } }) {
    const t = useTranslations("profile")
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: defaultValues.name || "",
            email: defaultValues.email || "",
            currentPassword: "",
            newPassword: "",
        },
    })

    async function onSubmit(data: ProfileFormValues) {
        setIsPending(true)
        try {
            const result = await updateProfile(data)
            if (result.ok) {
                toast.success(t("updateSuccess", { fallback: "Profile updated successfully" }))
                form.reset({
                    name: data.name,
                    email: data.email,
                    currentPassword: "",
                    newPassword: "",
                })
            } else {
                toast.error(result.error || t("updateError", { fallback: "Failed to update profile" }))
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            toast.error(message || t("updateError", { fallback: "Failed to update profile" }))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("name", { fallback: "Full Name" })}</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
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
                                <FormLabel>{t("email", { fallback: "Email Address" })}</FormLabel>
                                <FormControl>
                                    <Input placeholder="john@example.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="pt-6 border-t space-y-4">
                    <h3 className="text-lg font-medium">{t("changePassword", { fallback: "Change Password" })}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t("changePasswordDesc", { fallback: "Leave blank if you don't want to change it." })}
                    </p>
                    
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("currentPassword", { fallback: "Current Password" })}</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("newPassword", { fallback: "New Password" })}</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("saveChanges", { fallback: "Save Changes" })}
                </Button>
            </form>
        </Form>
    )
}
