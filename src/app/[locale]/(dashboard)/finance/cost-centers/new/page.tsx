import { CostCenterForm } from "@/components/finance/cost-center-form"

export default function NewCostCenterPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add Cost Center</h1>
                <p className="text-muted-foreground">
                    Create a new cost center for organizational financial tracking.
                </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
                <CostCenterForm />
            </div>
        </div>
    )
}
