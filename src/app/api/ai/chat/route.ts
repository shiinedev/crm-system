import { streamText, convertToModelMessages, type UIMessage, stepCountIs } from "ai"
import { openRouter, MODEL } from "@/server/ai/client"
import { buildCrmTools } from "@/server/ai/agent/tools"
import { getSessionWithOrg } from "@/utils/get-session"

export const maxDuration = 30

export async function POST(req: Request) {
  const { orgId } = await getSessionWithOrg()
  const { messages }: { messages: UIMessage[] } = await req.json()


  const validatedMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openRouter.chat(MODEL),
    system: `You are a CRM assistant. You help sales teams understand their pipeline, contacts, and deals.
Use your tools to fetch live data before answering. Be concise and clear.`,
    messages:validatedMessages,
    tools: buildCrmTools(orgId),
    stopWhen:stepCountIs(6)
  })

  return result.toUIMessageStreamResponse()
}
