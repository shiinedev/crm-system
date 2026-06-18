import { DocumentsList } from "@/modules/documents/components/documents-list"
import { Metadata } from "next"

export const metadata:Metadata= { title: "Documents" }

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Notes, files, and knowledge base</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <DocumentsList />
      </div>
    </div>
  )
}
