import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getSessionWithOrg } from "@/utils/get-session"
import { getDocumentById } from "@/db/queries/documents.queries"
import { DocumentDetailClient } from "@/modules/documents/components/document-detail"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  params: Promise<{ id: string }>
}

function DocumentDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="h-4 w-12 shrink-0" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

async function DocumentDetailContent({ id }: { id: string }) {
  const { orgId } = await getSessionWithOrg()

  const doc = await getDocumentById(id, orgId)
  if (!doc) notFound()

  return <DocumentDetailClient document={doc} />
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<DocumentDetailSkeleton />}>
      <DocumentDetailContent id={id} />
    </Suspense>
  )
}
