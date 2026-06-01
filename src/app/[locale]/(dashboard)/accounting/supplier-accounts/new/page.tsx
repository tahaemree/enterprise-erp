import { getTranslations } from "next-intl/server"
import { SupplierAccountForm } from "@/components/accounting/supplier-account-form"

export default async function NewSupplierAccountPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("accounting.supplierAccounts")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">
                    {t("description")}
                </p>
            </div>
            <div className="max-w-4xl">
                <SupplierAccountForm />
            </div>
        </div>
    )
}
