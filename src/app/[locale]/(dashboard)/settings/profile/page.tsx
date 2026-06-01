import { requireAuth } from "@/lib/auth-utils"
import { getTenantPrisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/settings/profile-form"
import { getTranslations } from "next-intl/server"

export default async function ProfilePage() {
    const userAuth = await requireAuth()
    const db = getTenantPrisma(userAuth.tenantId)
    const t = await getTranslations("profile")

    const user = await db.user.findUnique({
        where: { id: userAuth.id }
    })

    if (!user) {
        return <div>User not found</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t("title", { fallback: "My Profile" })}</h2>
                <p className="text-muted-foreground">
                    {t("description", { fallback: "Manage your personal information and password." })}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("personalInfo", { fallback: "Personal Information" })}</CardTitle>
                    <CardDescription>
                        {t("personalInfoDesc", { fallback: "Update your name and contact details." })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm 
                        defaultValues={{
                            name: user.name || "",
                            email: user.email || "",
                        }} 
                    />
                </CardContent>
            </Card>
        </div>
    )
}
