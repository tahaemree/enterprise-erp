import { getTranslations } from "next-intl/server"
import { LeaveRequestForm } from "@/components/hr/leave-request-form"

export default async function NewLeaveRequestPage() {
    const t = await getTranslations("leaveRequestForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-2xl">
                <LeaveRequestForm />
            </div>
        </div>
    )
}
