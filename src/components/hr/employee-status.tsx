"use client"

import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

// ==================== TYPES ====================

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "SUSPENDED" | "PROBATION"

// ==================== CONFIG ====================

export interface EmployeeStatusConfig {
    value: EmployeeStatus
    labelKey: string
    className: string
}

export const EMPLOYEE_STATUS_OPTIONS: EmployeeStatusConfig[] = [
    {
        value: "ACTIVE",
        labelKey: "ACTIVE",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    {
        value: "ON_LEAVE",
        labelKey: "ON_LEAVE",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    {
        value: "SUSPENDED",
        labelKey: "SUSPENDED",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
        value: "PROBATION",
        labelKey: "PROBATION",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        value: "TERMINATED",
        labelKey: "TERMINATED",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
]

const statusConfigMap: Record<EmployeeStatus, EmployeeStatusConfig> = Object.fromEntries(
    EMPLOYEE_STATUS_OPTIONS.map((opt) => [opt.value, opt])
) as Record<EmployeeStatus, EmployeeStatusConfig>

export function getEmployeeStatusConfig(status: EmployeeStatus): EmployeeStatusConfig {
    return statusConfigMap[status] ?? statusConfigMap.ACTIVE
}

// ==================== BADGE COMPONENT ====================

interface EmployeeStatusBadgeProps {
    status: EmployeeStatus
    className?: string
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
    const t = useTranslations("status")
    const config = getEmployeeStatusConfig(status)

    return (
        <Badge variant="secondary" className={cn(config.className, className)}>
            {t(config.labelKey)}
        </Badge>
    )
}

// ==================== SELECT COMPONENT ====================

interface EmployeeStatusSelectProps {
    value?: EmployeeStatus
    defaultValue?: EmployeeStatus
    onValueChange?: (value: EmployeeStatus) => void
    placeholder?: string
    disabled?: boolean
    id?: string
    "aria-describedby"?: string
    "aria-invalid"?: boolean
}

/**
 * Reusable status select that shows colored badge previews in the dropdown.
 * Use inside FormField's render prop:
 *
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="status"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Status</FormLabel>
 *       <EmployeeStatusSelect value={field.value} onValueChange={field.onChange} />
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 * ```
 */
export function EmployeeStatusSelect({
    value,
    defaultValue,
    onValueChange,
    placeholder,
    disabled = false,
    id,
    "aria-describedby": ariaDescribedby,
    "aria-invalid": ariaInvalid,
}: EmployeeStatusSelectProps) {
    const t = useTranslations("status")
    const tCommon = useTranslations("common")
    return (
        <Select
            value={value}
            defaultValue={defaultValue}
            onValueChange={(v) => onValueChange?.(v as EmployeeStatus)}
            disabled={disabled}
        >
            <SelectTrigger id={id} aria-describedby={ariaDescribedby} aria-invalid={ariaInvalid}>
                <SelectValue placeholder={placeholder ?? tCommon("select")}>
                    {value && (
                        <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium", getEmployeeStatusConfig(value).className)}>
                            {t(getEmployeeStatusConfig(value).labelKey)}
                        </span>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {EMPLOYEE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "inline-block h-2 w-2 rounded-full",
                                    option.value === "ACTIVE" && "bg-green-500",
                                    option.value === "ON_LEAVE" && "bg-yellow-500",
                                    option.value === "SUSPENDED" && "bg-orange-500",
                                    option.value === "PROBATION" && "bg-blue-500",
                                    option.value === "TERMINATED" && "bg-red-500"
                                )}
                            />
                            {t(option.labelKey)}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
