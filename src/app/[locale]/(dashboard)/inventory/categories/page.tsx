import { Link } from "@/i18n/navigation"
import { RoleGate } from "@/components/auth/role-gate"
import { Plus, FolderTree, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCategoriesWithCount } from "@/lib/actions/dashboard"

export default async function CategoriesPage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("inventory.categories")

    const categories = await getCategoriesWithCount()

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <RoleGate allow="MANAGER">
                <Button asChild>
                    <Link href="/inventory/categories/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("addCategory")}
                    </Link>
                </Button>
                </RoleGate>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card
                        key={category.id}
                        className="group relative overflow-hidden"
                    >
                        <div
                            className="absolute left-0 top-0 h-full w-1"
                            style={{ backgroundColor: category.color }}
                        />
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{
                                        backgroundColor: `${category.color}20`,
                                    }}
                                >
                                    <FolderTree
                                        className="h-5 w-5"
                                        style={{ color: category.color }}
                                    />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {category.name}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        /{category.slug}
                                    </p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {t("edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t("delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-3 line-clamp-2">
                                {category.description}
                            </CardDescription>
                            <Badge variant="secondary">
                                {category.productCount}{" "}
                                {t("productsCount")}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
