import { getTranslations } from "next-intl/server"
import { getCustomers } from "@/lib/actions/customers"
import { PipelineTable } from "@/components/crm/pipeline-table"

export default async function PipelinePage({
    params: _params,
}: {
    params: Promise<{ locale: string }>
}) {
    const t = await getTranslations("pipeline")
    const customersData = await getCustomers()

    // Filter leads (non-customer statuses)
    const leads = customersData.filter((c) =>
        ["LEAD", "QUALIFIED", "OPPORTUNITY", "PROPOSAL", "NEGOTIATION"].includes(c.status)
    ).map(l => ({
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        company: l.company || null,
        status: l.status,
        email: l.email || "",
        totalSpent: Number(l.totalSpent) || 0,
        createdAt: l.createdAt,
    }))

    const totalLeads = leads.length
    const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED").length
    const opportunities = leads.filter((l) => l.status === "OPPORTUNITY").length
    const negotiationLeads = leads.filter((l) => l.status === "NEGOTIATION").length

    return (
        <PipelineTable
            data={leads}
            title={t("title")}
            description={t("description")}
            addLeadText={t("addLead")}
            totalLeadsText={t("totalLeads")}
            qualifiedText={t("qualifiedLeads")}
            opportunitiesText={t("opportunities")}
            negotiationsText={t("negotiations")}
            searchText={t("search") || "Search leads..."}
            totalLeads={totalLeads}
            qualifiedLeads={qualifiedLeads}
            opportunities={opportunities}
            negotiationLeads={negotiationLeads}
        />
    )
}
