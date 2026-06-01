"use client"

import { Loader2, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isLoading?: boolean
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
    title,
    description,
    confirmText,
    cancelText,
}: ConfirmDeleteDialogProps) {
    const t = useTranslations("common")

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-destructive/10 p-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-base">
                            {title || t("confirmDeleteTitle")}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-2">
                        {description || t("confirmDeleteDescription")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelText || t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                    >
                        {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {confirmText || t("delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
