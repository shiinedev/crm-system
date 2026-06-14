"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, Building2, MapPin, Users, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ActivityTimeline } from "@/modules/activities/components/activity-timeline"
import { LogActivityForm } from "@/modules/activities/components/log-activity-form"
import { CompanyFormDialog } from "./companies-form-dialog"
import { formatCurrency } from "@/utils/format-currency"
import { formatDate } from "@/utils/format-date"
import { stripProtocol } from "@/utils/strip-protocol"
import type { Company, Contact, Deal, Activity } from "@/db/schema"

const LIFECYCLE_COLORS: Record<string, any> = {
    lead: "outline", prospect: "info", opportunity: "warning",
    customer: "success", churned: "destructive",
}

interface CompanyDetailClientProps {
    company: Company
    activities: Activity[]
    contacts: Contact[]
    deals: Deal[]
}

export function CompanyDetailClient({ company, activities, contacts, deals }: CompanyDetailClientProps) {
    const [editOpen, setEditOpen] = useState(false)

    const openDeals = deals.filter((d) => !d.deletedAt)
    const totalDealValue = openDeals.reduce((sum, d) => sum + Number(d.value ?? 0), 0)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Link href="/companies" className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Companies
                    </Link>
                </div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-lg font-semibold">
                            {company.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">{company.name}</h1>
                            <div className="flex items-center gap-3 mt-0.5">
                                {company.industry && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {company.industry}
                                    </span>
                                )}
                                {(company.city || company.country) && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {[company.city, company.country].filter(Boolean).join(", ")}
                                    </span>
                                )}
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
                                    >
                                        <Globe className="h-3.5 w-3.5" />
                                        {stripProtocol(company.website)}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {company.lifecycleStage && (
                            <Badge variant={LIFECYCLE_COLORS[company.lifecycleStage]} className="capitalize">
                                {company.lifecycleStage}
                            </Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-6 mt-4 pt-4 border-t">
                    <div className="text-center">
                        <p className="text-lg font-semibold">{contacts.length}</p>
                        <p className="text-xs text-muted-foreground">Contacts</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center">
                        <p className="text-lg font-semibold">{openDeals.length}</p>
                        <p className="text-xs text-muted-foreground">Open deals</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center">
                        <p className="text-lg font-semibold">{formatCurrency(totalDealValue, "USD", true)}</p>
                        <p className="text-xs text-muted-foreground">Pipeline value</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center">
                        <p className="text-lg font-semibold">{activities.length}</p>
                        <p className="text-xs text-muted-foreground">Activities</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="activity" className="h-full flex flex-col">
                    <TabsList className="mx-6 mt-4 w-fit">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
                        <TabsTrigger value="deals">Deals ({openDeals.length})</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="flex-1 overflow-y-auto mt-0">
                        <div className="p-6 space-y-4">
                            <LogActivityForm companyId={company.id} />
                            <ActivityTimeline activities={activities} />
                        </div>
                    </TabsContent>

                    <TabsContent value="contacts" className="flex-1 overflow-y-auto mt-0">
                        <div className="p-6 space-y-2">
                            {contacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No contacts yet.</p>
                            ) : contacts.map((contact) => (
                                <Link key={contact.id} href={`/contacts/${contact.id}`}>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {contact.firstName[0]}{contact.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{contact.firstName} {contact.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{contact.title ?? contact.email ?? "—"}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="deals" className="flex-1 overflow-y-auto mt-0">
                        <div className="p-6 space-y-2">
                            {openDeals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No open deals.</p>
                            ) : openDeals.map((deal) => (
                                <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="text-sm font-medium">{deal.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {deal.expectedCloseDate ? `Closes ${formatDate(deal.expectedCloseDate)}` : "No close date"}
                                        </p>
                                    </div>
                                    {deal.value && (
                                        <span className="text-sm font-semibold">
                                            {formatCurrency(deal.value, deal.currency ?? "USD")}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="details" className="flex-1 overflow-y-auto mt-0">
                        <div className="p-6">
                            <Card>
                                <CardContent className="pt-4">
                                    <dl className="space-y-3">
                                        {[
                                            { label: "Company size", value: company.companySize },
                                            { label: "Annual revenue", value: company.annualRevenue ? formatCurrency(company.annualRevenue) : null },
                                            { label: "Lead source", value: company.leadSource?.replace("_", " ") },
                                            { label: "Risk level", value: company.riskLevel },
                                            { label: "Timezone", value: company.timezone },
                                            { label: "Created", value: formatDate(company.createdAt) },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex gap-4">
                                                <dt className="text-sm text-muted-foreground w-36 shrink-0">{label}</dt>
                                                <dd className="text-sm capitalize">{value ?? "—"}</dd>
                                            </div>
                                        ))}
                                        {company.notes && (
                                            <div className="flex gap-4">
                                                <dt className="text-sm text-muted-foreground w-36 shrink-0">Notes</dt>
                                                <dd className="text-sm whitespace-pre-line">{company.notes}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
        </div>
    )
}