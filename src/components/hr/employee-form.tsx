"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createEmployeeSchema, type EmployeeFormData } from "@/lib/validations/hr"

import { EmployeeStatusSelect } from "@/components/hr/employee-status"
import { getDepartments } from "@/lib/actions/departments"
import { useTranslations } from "next-intl"
import { createLogger } from "@/lib/logger"

const logger = createLogger("employee-form")

interface DepartmentOption {
    id: string
    name: string
}

export function EmployeeForm() {
    const t = useTranslations("employeeForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [departments, setDepartments] = useState<DepartmentOption[]>([])
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)

    useEffect(() => {
        async function fetchDepartments() {
            try {
                const data = await getDepartments()
                setDepartments(
                    data.map((d) => ({
                        id: d.id,
                        name: d.name,
                    }))
                )
            } catch (error) {
                logger.error("Failed to load departments:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            } finally {
                setIsLoadingDepartments(false)
            }
        }
        fetchDepartments()
    }, [])

    const form = useForm<EmployeeFormData>({
        resolver: zodResolver(createEmployeeSchema(tVal)) as Resolver<EmployeeFormData>,
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            position: "",
            departmentId: "",
            status: "ACTIVE",
            hireDate: new Date(),
            salary: undefined,
            address: "",
            emergencyContact: "",
            emergencyPhone: "",
        },
    })

    async function onSubmit(data: EmployeeFormData) {
        setIsSubmitting(true)
        try {
            logger.info("Employee data", { data })

            // In production, this would call a createEmployee server action
            await new Promise((resolve) => setTimeout(resolve, 1000))

            toast.success(t("createSuccess"))
            router.push("/hr/employees")
            router.refresh()
        } catch (error) {
            logger.error("Error creating employee:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {Object.keys(form.formState.errors).length > 0 && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <p>{tVal("formErrors") || "Lütfen formdaki hataları düzeltin."}</p>
                    </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("personalInfo")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("firstName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("firstNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("lastName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("lastNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("email")}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder={t("emailPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("phone")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("phonePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("address")}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t("addressPlaceholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Employment Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("employmentDetails")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("position")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("positionPlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("department")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={cn(form.formState.errors.departmentId && "border-destructive")}>
                                                <SelectValue placeholder={t("departmentPlaceholder")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isLoadingDepartments ? (
                                                <SelectItem value="loading" disabled>
                                                    {t("loadingDepartments")}
                                                </SelectItem>
                                            ) : departments.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    {t("noDepartments")}
                                                </SelectItem>
                                            ) : (
                                                departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="hireDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t("hireDate")}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>{t("pickDate")}</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date > new Date()}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("status")}</FormLabel>
                                    <FormControl>
                                        <EmployeeStatusSelect
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("annualSalary")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder={t("salaryPlaceholder")}
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormDescription>{t("salaryDescription")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("emergencyContact")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("contactName")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("contactNamePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("contactPhone")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("contactPhonePlaceholder")} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("addEmployee")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
