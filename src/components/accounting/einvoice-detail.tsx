"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
    ArrowLeft,
    Send,
    Ban,
    RefreshCw,
    FileDigit,
    FileArchive,
    Truck,
    FileText,
    Copy,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

export interface EInvoiceDetailData {
    id: string
    uuid: string
    documentType: string
    profile?: string | null
    invoiceNumber?: string | null
    status: string
    senderTaxId: string
    senderName: string
    receiverTaxId: string
    receiverName: string
    receiverEmail?: string | null
    grossTotal: number
    vatBaseTotal: number
    vatTotal: number
    netTotal: number
    withholdingTotal: number
    currency: string
    exchangeRate?: number | null
    issueDate: Date
    dueDate?: Date | null
    retryCount: number
    lastError?: string | null
    lastAttemptAt?: Date | null
    notes?: string | null
    xmlContent?: string | null
    createdAt: Date
    updatedAt: Date
}

interface EInvoiceDetailProps {
    invoice: EInvoiceDetailData
    onBack: () => void
    onSubmit?: (id: string) => Promise<void>
    onCancel?: (id: string) => Promise<void>
    onRetry?: (id: string) => Promise<void>
}

function getStatusConfig(status: string) {
    const configs: Record<string, { label: string; icon: React.ElementType; color: string }> = {
        DRAFT: { label: "Draft", icon: Clock, color: "text-gray-500" },
        PENDING_SIGN: { label: "Pending Sign", icon: Clock, color: "text-yellow-500" },
        SIGNED: { label: "Signed", icon: CheckCircle2, color: "text-blue-500" },
        SENDING: { label: "Sending", icon: Clock, color: "text-blue-500" },
        SENT_TO_GIB: { label: "Sent to GİB", icon: Clock, color: "text-purple-500" },
        GIB_ACCEPTED: { label: "Accepted", icon: CheckCircle2, color: "text-green-500" },
        GIB_REJECTED: { label: "Rejected", icon: XCircle, color: "text-red-500" },
        GIB_WARNING: { label: "Accepted with Warning", icon: AlertTriangle, color: "text-yellow-500" },
        CANCELLED: { label: "Cancelled", icon: XCircle, color: "text-gray-500" },
        ERROR: { label: "Error", icon: AlertTriangle, color: "text-red-500" },
    }
    return configs[status] || { label: status, icon: Clock, color: "text-gray-500" }
}

export function EInvoiceDetail({ invoice, onBack, onSubmit, onCancel, onRetry }: EInvoiceDetailProps) {
    const router = useRouter()
    const t = useTranslations()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const statusCfg = getStatusConfig(invoice.status)
    const StatusIcon = statusCfg.icon

    const canSend = invoice.status === "DRAFT" || invoice.status === "ERROR"
    const canRetry = invoice.status === "ERROR" || invoice.status === "GIB_REJECTED"
    const canCancel = invoice.status !== "GIB_ACCEPTED" && invoice.status !== "CANCELLED"

    const handleSubmit = async () => {
        if (!onSubmit) return
        setIsSubmitting(true)
        try {
            await onSubmit(invoice.id)
            toast.success("Submitted to GİB successfully")
            router.refresh()
        } catch (_error) {
            toast.error("Failed to submit to GİB")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = async () => {
        if (!onCancel) return
        setIsSubmitting(true)
        try {
            await onCancel(invoice.id)
            toast.success("Invoice cancelled")
            router.refresh()
        } catch (_error) {
            toast.error("Failed to cancel invoice")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRetry = async () => {
        if (!onRetry) return
        setIsSubmitting(true)
        try {
            await onRetry(invoice.id)
            toast.success("Retrying submission...")
            router.refresh()
        } catch (_error) {
            toast.error("Failed to retry submission")
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const docTypeLabel = invoice.documentType === "INVOICE" ? "e-Fatura"
        : invoice.documentType === "ARCHIVE" ? "e-Arşiv Fatura"
        : invoice.documentType === "DESPATCH_ADVICE" ? "e-İrsaliye"
        : invoice.documentType

    const docTypeIcon = invoice.documentType === "INVOICE" ? FileDigit
        : invoice.documentType === "ARCHIVE" ? FileArchive
        : invoice.documentType === "DESPATCH_ADVICE" ? Truck
        : FileText

    const DocTypeIcon = docTypeIcon

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <DocTypeIcon className="h-6 w-6 text-muted-foreground" />
                            <h1 className="text-2xl font-bold tracking-tight">
                                {docTypeLabel} — {invoice.invoiceNumber || "No Number"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
                            <span className={`text-sm font-medium ${statusCfg.color}`}>
                                {t.has(`status.${invoice.status}`) ? t(`status.${invoice.status}`) : statusCfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">UUID: {invoice.uuid}</span>
                            <button onClick={() => copyToClipboard(invoice.uuid)} className="text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canSend && (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            <Send className="mr-2 h-4 w-4" />
                            Submit to GİB
                        </Button>
                    )}
                    {canRetry && (
                        <Button variant="secondary" onClick={handleRetry} disabled={isSubmitting}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    )}
                    {canCancel && (
                        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="xml">UBL XML</TabsTrigger>
                    <TabsTrigger value="retry">Submission Log</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Sender */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Sender (Supplier)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{invoice.senderName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax ID:</span>
                                    <span className="font-mono">{invoice.senderTaxId}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Receiver */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Receiver (Customer)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{invoice.receiverName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax ID:</span>
                                    <span className="font-mono">{invoice.receiverTaxId}</span>
                                </div>
                                {invoice.receiverEmail && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span>{invoice.receiverEmail}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <span className="text-xs text-muted-foreground">Gross Total</span>
                                    <p className="text-lg font-bold">{formatCurrency(invoice.grossTotal, invoice.currency)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">VAT Base</span>
                                    <p className="text-lg font-bold">{formatCurrency(invoice.vatBaseTotal, invoice.currency)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">VAT Total</span>
                                    <p className="text-lg font-bold">{formatCurrency(invoice.vatTotal, invoice.currency)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Net Total</span>
                                    <p className="text-lg font-bold">{formatCurrency(invoice.netTotal, invoice.currency)}</p>
                                </div>
                            </div>
                            {invoice.withholdingTotal > 0 && (
                                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    Withholding: {formatCurrency(invoice.withholdingTotal, invoice.currency)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Dates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <span className="text-xs text-muted-foreground">Issue Date</span>
                                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Due Date</span>
                                    <p className="font-medium">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Created</span>
                                    <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {invoice.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="xml" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">UBL TR 2.1 XML</CardTitle>
                            {invoice.xmlContent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(invoice.xmlContent!)}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy XML
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {invoice.xmlContent ? (
                                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px] font-mono">
                                    {invoice.xmlContent}
                                </pre>
                            ) : (
                                <p className="text-sm text-muted-foreground">XML content not available</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="retry" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Submission Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Retry Count</span>
                                    <span className="font-mono">{invoice.retryCount}</span>
                                </div>
                                {invoice.lastAttemptAt && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Last Attempt:</span>
                                        <span>{formatDate(invoice.lastAttemptAt)}</span>
                                    </div>
                                )}
                                {invoice.lastError && (
                                    <div className="mt-4">
                                        <span className="text-sm text-muted-foreground">Last Error:</span>
                                        <pre className="mt-1 text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-3 rounded-lg">
                                            {invoice.lastError}
                                        </pre>
                                    </div>
                                )}
                                {!invoice.lastError && invoice.retryCount === 0 && (
                                    <p className="text-sm text-muted-foreground">No submission attempts yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
