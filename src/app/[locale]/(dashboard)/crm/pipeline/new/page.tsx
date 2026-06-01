import { getTranslations } from "next-intl/server"
import { LeadForm } from "@/components/crm/lead-form"

export default async function NewLeadPage() {
    const t = await getTranslations("leadForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-2xl">
                <LeadForm />
            </div>
        </div>
    )
}
