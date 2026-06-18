"use client"

import { useState } from "react"
import { useTRPC} from "@/lib/trpc/client"
import { Plus, Search, FileText, Pencil, Trash2, MoreHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentFormDialog } from "./document-form-dialog"
import { useDeleteDocument } from "../hooks/use-document-mutations"
import { useFilters } from "@/hooks/use-filters"
import { formatRelativeTime } from "@/utils/format-date"
import type { Document } from "@/db/schema"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

export function DocumentsList() {
  const [formOpen, setFormOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | undefined>()
  const { q, setFilter, hasActiveFilters, resetFilters } = useFilters()
  const trpc = useTRPC()

  const { data: documents = [], isLoading } = useQuery(trpc.documents.list.queryOptions())
  const { execute: deleteDocument } = useDeleteDocument()

  const filtered = documents.filter((d) =>
    !q || d.title.toLowerCase().includes(q.toLowerCase())
  )

  function handleEdit(doc: Document) {
    setEditDoc(doc)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8 h-8 text-sm"
              value={q}
              onChange={(e) => setFilter("q", e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={resetFilters}>
              <X className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>
        <Button size="sm" onClick={() => { setEditDoc(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4" />New note
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "No documents match your search" : "No documents yet"}
            </p>
            {!hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
                Create your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <Link href={`/documents/${doc.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      {doc.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {doc.content.replace(/[#*`]/g, "").slice(0, 100)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(doc.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(doc)}>
                        <Pencil className="h-4 w-4" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteDocument({ id: doc.id })}
                      >
                        <Trash2 className="h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentFormDialog open={formOpen} onOpenChange={setFormOpen} document={editDoc} />
    </div>
  )
}
