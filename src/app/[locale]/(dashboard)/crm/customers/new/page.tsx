import { getTranslations } from "next-intl/server"
import { CustomerForm } from "@/components/crm/customer-form"

export default async function NewCustomerPage() {
    const t = await getTranslations("customerForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-3xl">
                <CustomerForm />
            </div>
        </div>
    )
}
