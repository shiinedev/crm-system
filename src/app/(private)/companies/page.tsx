import { CompaniesTable } from "@/modules/companies/components/companies-table"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Companies" }

export default function CompaniesPage() {


  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your company relationships</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CompaniesTable />
      </div>
    </div>
  )
}