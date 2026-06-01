"use client"

import { useTranslations } from "next-intl"
import { useEffect, type ReactNode } from "react"
import { z } from "zod"

/**
 * ZodI18nProvider initializes Zod error messages from next-intl translations.
 * Uses the zod section from locale message files for validation messages.
 */
export function ZodI18nProvider({ children }: { children: ReactNode }) {
    const t = useTranslations("zod.errors")

    useEffect(() => {
        const errorMap: z.ZodErrorMap = (issue, ctx) => {
            let message = ctx.defaultError

            switch (issue.code) {
                case z.ZodIssueCode.invalid_type: {
                    if (issue.received === z.ZodParsedType.undefined || issue.received === z.ZodParsedType.null) {
                        message = t("invalid_type_received_undefined")
                    } else {
                        message = t("invalid_type", {
                            expected: issue.expected,
                            received: issue.received,
                        })
                    }
                    break
                }
                case z.ZodIssueCode.invalid_literal: {
                    message = t("invalid_literal", { expected: String(issue.expected) })
                    break
                }
                case z.ZodIssueCode.unrecognized_keys: {
                    message = t("unrecognized_keys", { keys: issue.keys.join(", ") })
                    break
                }
                case z.ZodIssueCode.invalid_union: {
                    message = t("invalid_union")
                    break
                }
                case z.ZodIssueCode.invalid_enum_value: {
                    message = t("invalid_enum_value", {
                        options: issue.options.join(", "),
                        received: String(issue.received),
                    })
                    break
                }
                case z.ZodIssueCode.invalid_date: {
                    message = t("invalid_date")
                    break
                }
                case z.ZodIssueCode.custom: {
                    message = ctx.defaultError
                    break
                }
                case z.ZodIssueCode.invalid_string: {
                    if (issue.validation === "email") {
                        message = t("invalid_string.email", { validation: issue.validation })
                    } else if (issue.validation === "url") {
                        message = t("invalid_string.url", { validation: issue.validation })
                    } else {
                        message = t("invalid_string.regex")
                    }
                    break
                }
                case z.ZodIssueCode.too_small: {
                    if (issue.type === "string") {
                        message = t("too_small.string.inclusive", { minimum: String(issue.minimum) })
                    } else if (issue.type === "number") {
                        message = t("too_small.number.inclusive", { minimum: String(issue.minimum) })
                    } else if (issue.type === "array") {
                        message = t("too_small.array.inclusive", { minimum: String(issue.minimum) })
                    } else {
                        message = t("too_small.string.inclusive", { minimum: String(issue.minimum) })
                    }
                    break
                }
                case z.ZodIssueCode.too_big: {
                    if (issue.type === "string") {
                        message = t("too_big.string.inclusive", { maximum: String(issue.maximum) })
                    } else if (issue.type === "number") {
                        message = t("too_big.number.inclusive", { maximum: String(issue.maximum) })
                    } else if (issue.type === "array") {
                        message = t("too_big.array.inclusive", { maximum: String(issue.maximum) })
                    } else {
                        message = t("too_big.string.inclusive", { maximum: String(issue.maximum) })
                    }
                    break
                }
            }

            return { message }
        }

        z.setErrorMap(errorMap)
    }, [t])

    return <>{children}</>
}
