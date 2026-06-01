import { getTranslations } from "next-intl/server"
import { CategoryForm } from "@/components/inventory/category-form"

export default async function NewCategoryPage() {
    const t = await getTranslations("categoryForm")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="max-w-2xl">
                <CategoryForm />
            </div>
        </div>
    )
}
