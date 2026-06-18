import { getSessionWithOrg } from "@/utils/get-session"
import { AIChatPanel } from "@/modules/ai/components/ai-chat-panel"
import { Metadata } from "next"

export const metadata:Metadata = { title: "AI Assistant" }

export default async function AIChatPage() {
  await getSessionWithOrg()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ask questions about your CRM data, pipeline, and contacts
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel />
      </div>
    </div>
  )
}
