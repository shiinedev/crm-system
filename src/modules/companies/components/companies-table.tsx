"use client"

import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"
import { MoreHorizontal, Plus, Search, Building2, Globe, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { CompanyFormDialog } from "./companies-form-dialog"
import { useDeleteCompany } from "../hooks/use-company-mutations"
import { useFilters } from "@/hooks/use-filters"
import { stripProtocol } from "@/utils/strip-protocol"
import type { Company } from "@/db/schema"
import { useQuery } from '@tanstack/react-query';
import { CompaniesTableSkeleton } from "./companies-skelton"

const LIFECYCLE_COLORS: Record<string, "default" | "info" | "warning" | "success" | "destructive" | "outline"> = {
  lead: "outline",
  prospect: "info",
  opportunity: "warning",
  customer: "success",
  churned: "destructive",
}

export function CompaniesTable() {
  const [formOpen, setFormOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | undefined>()

  const trpc = useTRPC()

  const {
    q, setFilter,
    companyLifecycle, companyIndustry, companySize,
    hasActiveFilters, resetFilters,
  } = useFilters()

  const { data: companies = [], isLoading } = useQuery(trpc.companies.list.queryOptions())
  const { execute: deleteCompany } = useDeleteCompany();

  console.log("Companies data:", companies);

  // Client-side filtering driven by URL params
  const filtered = companies.filter((c) => {
    const matchesQ = !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.industry?.toLowerCase().includes(q.toLowerCase()) ||
      c.city?.toLowerCase().includes(q.toLowerCase())
    const matchesLifecycle = !companyLifecycle || c.lifecycleStage === companyLifecycle
    const matchesIndustry = !companyIndustry || c.industry?.toLowerCase().includes(companyIndustry.toLowerCase())
    const matchesSize = !companySize || c.companySize === companySize
    return matchesQ && matchesLifecycle && matchesIndustry && matchesSize
  })

  function handleEdit(company: Company) {
    setEditCompany(company)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditCompany(undefined)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              className="pl-8 h-8 text-sm"
              value={q}
              onChange={(e) => setFilter("q", e.target.value)}
            />
          </div>

          {/* Lifecycle filter */}
          <Select
            value={companyLifecycle || "all"}
            onValueChange={(v) => setFilter("companyLifecycle", v === "all" ? null : v as any)}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {["lead", "prospect", "opportunity", "customer", "churned"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Size filter */}
          <Select
            value={companySize || "all"}
            onValueChange={(v) => setFilter("companySize", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any size</SelectItem>
              {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={resetFilters}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add company
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto ">
        {isLoading ? (
          <CompaniesTableSkeleton />

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "No companies match your filters" : "No companies yet"}
            </p>
            {!hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={handleCreate}>
                Add your first company
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Industry</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Stage</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Size</th>
                <th className="w-10 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-b hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted font-medium text-xs">
                        {company.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{company.name}</div>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="h-2.5 w-2.5" />
                            {stripProtocol(company.website)}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{company.industry ?? "—"}</td>
                  <td className="px-4 py-3">
                    {company.lifecycleStage ? (
                      <Badge variant={LIFECYCLE_COLORS[company.lifecycleStage] ?? "outline"} className="capitalize">
                        {company.lifecycleStage}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{company.companySize ?? "—"}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteCompany({ id: company.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        company={editCompany}
      />
    </div>
  )
}