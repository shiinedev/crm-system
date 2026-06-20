"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Eye, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateDocument, useDeleteDocument } from "../hooks/use-document-mutations"
import { formatDate } from "@/utils/format-date"
import type { Document } from "@/db/schema"
import { useRouter } from "next/navigation"
import { Streamdown } from "streamdown"

interface DocumentDetailClientProps {
  document: Document
}

export function DocumentDetailClient({ document }: DocumentDetailClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content ?? "")

  const [view, setView] = useState<"write" | "preview">("write")

  const { execute: updateDocument, isPending: isSaving } = useUpdateDocument()
  const { execute: deleteDocument, isPending: isDeleting } = useDeleteDocument()

  const isDirty =
    title !== document.title ||
    content !== (document.content ?? "");


  function handleSave() {
    updateDocument({ id: document.id, title, content })
  }

  function handleDelete() {
    deleteDocument({ id: document.id })
    router.push("/documents")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/documents" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" />
            Docs
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 shadow-none text-lg font-semibold px-0 focus-visible:ring-0 h-auto py-0"
            placeholder="Untitled"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Updated {formatDate(document.updatedAt)}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-1 px-6 pt-3 pb-0">
          <Button
            size="sm"
            variant={view === "write" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 text-xs"
            onClick={() => setView("write")}
          >
            <Code2 className="h-3.5 w-3.5" />Write
          </Button>
          <Button
            size="sm"
            variant={view === "preview" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 text-xs"
            onClick={() => setView("preview")}
          >
            <Eye className="h-3.5 w-3.5" />Preview
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === "write" ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing... Markdown supported."
              className="min-h-full font-mono text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0"
              style={{ height: "100%" }}
            />
          ) : (
            <div
              className="prose prose-sm max-w-none text-foreground"
              >
                <Streamdown>{content ? content : '<p class="text-muted-foreground">Nothing to preview yet.</p>' }</Streamdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
