import { streamText, convertToModelMessages, type UIMessage, stepCountIs } from "ai"
import { openRouter, MODEL } from "@/server/ai/client"
import { buildCrmTools } from "@/server/ai/agent/tools"
import { getApiSession } from "@/utils/get-session"
import { rateLimit } from "@/server/security/rate-limit"

export const maxDuration = 30

/** Hard cap on conversation size to bound token cost and abuse */
const MAX_MESSAGES = 50

export async function POST(req: Request) {
  // Zero trust: API routes return status codes, never redirects.
  const session = await getApiSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!session.orgId) {
    return Response.json({ error: "No active organization" }, { status: 403 })
  }

  // AI calls are the most expensive endpoint — rate limit per user.
  const limit = await rateLimit(`ai-chat:${session.user.id}`, 20, 60)
  if (!limit.success) {
    return Response.json(
      { error: "Too many requests. Slow down." },
      { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } }
    )
  }

  let messages: UIMessage[]
  try {
    const body = await req.json()
    messages = body?.messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return Response.json({ error: "Invalid messages payload" }, { status: 400 })
    }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const validatedMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: openRouter.chat(MODEL),
    system: `You are a CRM assistant. You help sales teams understand their pipeline, contacts, and deals.
Use your tools to fetch live data before answering. Be concise and clear.`,
    messages: validatedMessages,
    // Tools are scoped to the caller's org — the model can never reach another tenant's data.
    tools: buildCrmTools(session.orgId),
    stopWhen: stepCountIs(6),
  })

  return result.toUIMessageStreamResponse()
}
