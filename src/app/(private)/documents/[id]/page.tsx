import { notFound } from "next/navigation"
import { getSessionWithOrg } from "@/utils/get-session"
import { getDocumentById } from "@/db/queries/documents.queries"
import { DocumentDetailClient } from "@/modules/documents/components/document-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params
  const { orgId } = await getSessionWithOrg()

  const doc = await getDocumentById(id, orgId)
  if (!doc) notFound()

  return <DocumentDetailClient document={doc} />
}
