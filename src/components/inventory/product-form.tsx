"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createProduct, updateProduct } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    productSchema,
    type ProductFormValues,
} from "@/lib/validations/inventory"
import { generateSKU } from "@/lib/utils"

interface SelectOption {
    id: string
    name: string
}

interface ProductFormProps {
    categories: SelectOption[]
    suppliers: SelectOption[]
    initialData?: Partial<ProductFormValues> & { id?: string }
}

export function ProductForm({ categories, suppliers, initialData }: ProductFormProps) {
    const t = useTranslations("productForm")
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const isEditMode = !!initialData?.id

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            sku: initialData?.sku || "",
            barcode: initialData?.barcode || "",
            price: initialData?.price ?? 0,
            costPrice: initialData?.costPrice ?? undefined,
            quantity: initialData?.quantity ?? 0,
            minStock: initialData?.minStock ?? 10,
            maxStock: initialData?.maxStock ?? undefined,
            unit: initialData?.unit || "piece",
            categoryId: initialData?.categoryId || "",
            supplierId: initialData?.supplierId || "",
            isActive: initialData?.isActive ?? true,
        },
    })

    const units = [
        { value: "piece", label: t("unitPiece") },
        { value: "kg", label: t("unitKg") },
        { value: "g", label: t("unitG") },
        { value: "l", label: t("unitL") },
        { value: "ml", label: t("unitMl") },
        { value: "m", label: t("unitM") },
        { value: "cm", label: t("unitCm") },
        { value: "box", label: t("unitBox") },
        { value: "pack", label: t("unitPack") },
    ]

    const onSubmit = async (data: ProductFormValues) => {
        setIsLoading(true)
        try {
            if (isEditMode && initialData?.id) {
                await updateProduct({ id: initialData.id, ...data })
                toast.success(t("updateSuccess"))
            } else {
                await createProduct(data)
                toast.success(t("createSuccess"))
            }
            router.push("/inventory/products")
            router.refresh()
        } catch {
            toast.error(isEditMode ? t("updateError") : t("createError"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateSKU = () => {
        const name = form.getValues("name")
        if (name) {
            const sku = generateSKU(name)
            form.setValue("sku", sku)
        } else {
            toast.error(t("skuError"))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/inventory/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditMode ? t("editTitle") : t("title")}
                    </h1>
                    <p className="text-muted-foreground">{isEditMode ? t("editDescription") : t("description")}</p>
                </div>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>{t("productDetails")}</CardTitle>
                                <CardDescription>
                                    {t("productDetailsDescription")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("productName")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("productNamePlaceholder")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("description")}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t("descriptionPlaceholder")}
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("sku")}</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t("skuPlaceholder")}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleGenerateSKU}
                                                    >
                                                        {t("generate")}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="barcode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("barcode")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("barcodePlaceholder")}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("category")}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t("selectCategory")}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.length === 0 ? (
                                                            <SelectItem
                                                                value="none"
                                                                disabled
                                                            >
                                                                {t("noCategories")}
                                                            </SelectItem>
                                                        ) : (
                                                            categories.map(
                                                                (category) => (
                                                                    <SelectItem
                                                                        key={category.id}
                                                                        value={category.id}
                                                                    >
                                                                        {category.name}
                                                                    </SelectItem>
                                                                )
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="supplierId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("supplier")}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t("selectSupplier")}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {suppliers.length === 0 ? (
                                                            <SelectItem
                                                                value="none"
                                                                disabled
                                                            >
                                                                {t("noSuppliers")}
                                                            </SelectItem>
                                                        ) : (
                                                            suppliers.map(
                                                                (supplier) => (
                                                                    <SelectItem
                                                                        key={supplier.id}
                                                                        value={supplier.id}
                                                                    >
                                                                        {supplier.name}
                                                                    </SelectItem>
                                                                )
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("pricing")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("sellingPrice")}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            $
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            className="pl-7"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="costPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("costPrice")}</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            $
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            className="pl-7"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    {t("costPriceDescription")}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("inventory")}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("currentStock")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="minStock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("minStock")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="maxStock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("maxStock")}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("unit")}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t("selectUnit")}
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {units.map((unit) => (
                                                            <SelectItem
                                                                key={unit.value}
                                                                value={unit.value}
                                                            >
                                                                {unit.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("status")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>
                                                        {t("active")}
                                                    </FormLabel>
                                                    <FormDescription>
                                                        {t("productActiveDescription")}
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/inventory/products">
                                {t("cancel")}
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? t("saving") : t("creating")}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditMode ? t("updateProduct") : t("createProduct")}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
