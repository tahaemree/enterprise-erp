import { getTranslations } from "next-intl/server"
import { EmployeeForm } from "@/components/hr/employee-form"

export default async function NewEmployeePage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("employeeForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-muted-foreground">
                    {t("description")}
                </p>
            </div>
            <div className="max-w-2xl">
                <EmployeeForm />
            </div>
        </div>
    )
}
