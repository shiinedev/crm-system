import { streamText, convertToModelMessages, type UIMessage, stepCountIs } from "ai"
import { z } from "zod"
import { openRouter, MODEL } from "@/server/ai/client"
import { buildCrmTools } from "@/server/ai/agent/tools"
import { getSessionWithOrg } from "@/utils/get-session"
import { limitAiChat } from "@/server/cache/rate-limit"

export const maxDuration = 30

// 200 KB is generous for a chat history; anything larger is abuse or a bug
const MAX_BODY_BYTES = 200 * 1024
const MAX_MESSAGES = 50

const bodySchema = z.object({
  messages: z.array(z.unknown()).min(1).max(MAX_MESSAGES),
})

export async function POST(req: Request) {
  const { user, orgId } = await getSessionWithOrg()

  const { success, retryAfter } = await limitAiChat(user.id)
  if (!success) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
    )
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Request body too large." }, { status: 413 })
  }

  let messages: UIMessage[]
  try {
    const parsed = bodySchema.parse(JSON.parse(raw))
    messages = parsed.messages as UIMessage[]
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const validatedMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: openRouter.chat(MODEL),
    system: `You are a CRM assistant. You help sales teams understand their pipeline, contacts, and deals.
Use your tools to fetch live data before answering. Be concise and clear.`,
    messages: validatedMessages,
    tools: buildCrmTools(orgId),
    stopWhen: stepCountIs(6),
  })

  return result.toUIMessageStreamResponse()
}
