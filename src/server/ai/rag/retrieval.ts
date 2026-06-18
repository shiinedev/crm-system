import "server-only"
import { Pinecone } from "@pinecone-database/pinecone"
import { embed } from "ai"
import { EMPPED_MODEL, openRouter,  } from "../client"
import { env } from "@/lib/env"

function getIndex() {
  if (!env.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY not set")
  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY })
  return pc.index(env.PINECONE_INDEX ?? "crm-ai")
}

async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model:openRouter.textEmbeddingModel(EMPPED_MODEL),
    value: text,
  })
  return embedding
}

export async function upsertEmbedding(params: {
  id: string
  text: string
  orgId: string
  metadata?: Record<string, string>
}) {
  const values = await embedText(params.text)
  await getIndex().upsert({
    records: [{
      id: params.id,
      values,
      metadata: { orgId: params.orgId, ...params.metadata },
    }],
  })
}

export async function searchSimilar(params: {
  query: string
  orgId: string
  topK?: number
}): Promise<Array<{ id: string; score: number; metadata: Record<string, string> }>> {
  const vector = await embedText(params.query)
  const result = await getIndex().query({
    vector,
    topK: params.topK ?? 5,
    filter: { orgId: params.orgId },
    includeMetadata: true,
  })
  return (result.matches ?? []).map((m) => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: (m.metadata ?? {}) as Record<string, string>,
  }))
}
