import { CostCenterForm } from "@/components/finance/cost-center-form"

export default function NewAccountingCostCenterPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add Cost Center</h1>
                <p className="text-muted-foreground">
                    Create a new cost center for organizational financial tracking and budget allocation.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <CostCenterForm />
            </div>
        </div>
    )
}
