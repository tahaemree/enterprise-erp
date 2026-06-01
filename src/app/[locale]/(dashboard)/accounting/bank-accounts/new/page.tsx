import { BankAccountForm } from "@/components/finance/bank-account-form"

export default function NewAccountingBankAccountPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add Bank Account</h1>
                <p className="text-muted-foreground">
                    Create a new bank account. IBAN details will be encrypted securely (KVKK compliant).
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <BankAccountForm />
            </div>
        </div>
    )
}
