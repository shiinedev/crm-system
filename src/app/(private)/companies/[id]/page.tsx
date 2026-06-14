import { notFound } from "next/navigation"
import { getSessionWithOrg } from "@/utils/get-session"
import { getCompanyById } from "@/db/queries/companies.queries"
import { getActivitiesByCompany } from "@/db/queries/activities.queries"
import { getContactsByCompany } from "@/db/queries/contacts.queries"
import { getDealsByCompany } from "@/db/queries/deals.queries"
import { CompanyDetailClient } from "@/modules/companies/components/compnay-details"

interface Props {
    params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: Props) {
    const { id } = await params
    const { orgId } = await getSessionWithOrg()

    const [company, activities, contacts, deals] = await Promise.all([
        getCompanyById(id, orgId),
        getActivitiesByCompany(id, orgId),
        getContactsByCompany(id, orgId),
        getDealsByCompany(id, orgId),
    ])

    if (!company) notFound()

    return (
        <CompanyDetailClient
            company={company}
            activities={activities}
            contacts={contacts}
            deals={deals}
        />
    )
}