import { CheckNoteForm } from "@/components/finance/check-note-form"

export default function NewAccountingCheckNotePage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add Document</h1>
                <p className="text-muted-foreground">
                    Register a new check or promissory note. Tax ID details will be securely encrypted.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <CheckNoteForm />
            </div>
        </div>
    )
}
