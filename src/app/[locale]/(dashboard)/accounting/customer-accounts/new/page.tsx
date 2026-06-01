import { getTranslations } from "next-intl/server"
import { CustomerAccountForm } from "@/components/accounting/customer-account-form"

export default async function NewCustomerAccountPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.customerAccounts")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">
                    {t("description")}
                </p>
            </div>
            <div className="max-w-4xl">
                <CustomerAccountForm />
            </div>
        </div>
    )
}
