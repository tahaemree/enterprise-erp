"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, differenceInCalendarDays } from "date-fns"

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
import { createLeaveRequestSchema, type LeaveRequestFormData } from "@/lib/validations/hr"

import { createLeaveRequest } from "@/lib/actions/leave-requests"
import { getEmployees } from "@/lib/actions/employees"
import { createLogger } from "@/lib/logger"

const logger = createLogger("leave-request-form")

interface EmployeeOption {
    id: string
    name: string
}

const leaveTypes = [
    "ANNUAL", "SICK", "PERSONAL", "MATERNITY", "PATERNITY",
    "BEREAVEMENT", "UNPAID", "COMPENSATORY", "OTHER",
] as const

export function LeaveRequestForm() {
    const t = useTranslations("leaveRequestForm")
    const tVal = useTranslations("validation")
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [employees, setEmployees] = useState<EmployeeOption[]>([])
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const data = await getEmployees()
                setEmployees(data.map((e) => ({
                    id: e.id,
                    name: `${e.firstName} ${e.lastName}`,
                })))
            } catch (error) {
                logger.error("Failed to load employees:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
            } finally {
                setIsLoadingEmployees(false)
            }
        }
        fetchEmployees()
    }, [])

    const form = useForm<LeaveRequestFormData>({
        resolver: zodResolver(createLeaveRequestSchema(tVal)) as Resolver<LeaveRequestFormData>,
        defaultValues: {
            employeeId: "",
            type: "ANNUAL",
            startDate: undefined,
            endDate: undefined,
            reason: "",
        },
    })

    const watchStartDate = form.watch("startDate")
    const watchEndDate = form.watch("endDate")

    const totalDays = watchStartDate && watchEndDate
        ? differenceInCalendarDays(watchEndDate, watchStartDate) + 1
        : 0

    async function onSubmit(data: LeaveRequestFormData) {
        setIsSubmitting(true)
        try {
            await createLeaveRequest(data)
            toast.success(t("createSuccess"))
            router.push("/hr/leave")
            router.refresh()
        } catch {
            toast.error(t("createError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("employee")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("selectEmployee")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isLoadingEmployees ? (
                                        <SelectItem value="loading" disabled>{t("loadingEmployees")}</SelectItem>
                                    ) : employees.length === 0 ? (
                                        <SelectItem value="none" disabled>{t("noEmployees")}</SelectItem>
                                    ) : (
                                        employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
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
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("leaveType")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("selectLeaveType")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {leaveTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {t(`type_${type}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("startDate")}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>{t("pickDate")}</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
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
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("endDate")}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>{t("pickDate")}</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => watchStartDate ? date < watchStartDate : false}
                                            autoFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {totalDays > 0 && (
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                        <span className="font-medium">{t("totalDays")}:</span>{" "}
                        {totalDays} {totalDays === 1 ? t("day") : t("days")}
                    </div>
                )}

                <Separator />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("reason")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("reasonPlaceholder")}
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>{t("reasonDescription")}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? t("creating") : t("createRequest")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
