"use client"

/**
 * AI Chat Panel — uses AI Elements + typed CRM tool parts.
 *
 * Run once to install components:
 *   npx ai-elements@latest add conversation message prompt-input suggestion tool
 */

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai"
import { Bot, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

// AI Elements components
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion"

import { CrmToolOutputUI, toolLabel } from "./tool-call"
import type { CrmToolUIPart, CrmToolsMap } from "../types"
import { ThinkingBubble } from "./ai-thinking-babel"
import { StreamingBar } from "./ai-streaming-bar"
import { ErrorBanner } from "./ai-error-banner"

// Types

/**
 * ToolHeaderProps as declared in AI Elements tool.tsx (from GitHub issue #275):
 *   type: ToolUIPart["type"]  — must be `tool-${NAME}`, not DynamicToolUIPart
 *   state: ToolUIPart["state"]
 *   title?: string
 *   className?: string
 *
 * We pass our CrmToolUIPart directly — it satisfies ToolUIPart<CrmToolsMap>,
 * so .type and .state are correct.
 */

const SUGGESTIONS = [
  "How many open deals do I have?",
  "Which contacts have the highest lead score?",
  "Summarize my pipeline health",
  "What did my notes say about Acme Corp?",
]

// ─── Type guard to narrow a message part to CrmToolUIPart

function isCrmToolPart(
  part: UIMessage["parts"][number]
): part is CrmToolUIPart {
  // isToolUIPart checks `type.startsWith("tool-")` and validates the shape
  return isToolUIPart(part) && part.type.slice(5) in ({
    getDashboardSummary: true, listCompanies: true, getCompany: true,
    listContacts: true, getContact: true, listDeals: true, getDeal: true,
    getDealStats: true, listOpenTasks: true, recentActivity: true,
    searchDocuments: true,
  } satisfies Record<keyof CrmToolsMap, true>)
}


// ─── Component ────

export function AIChatPanel() {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status:chatStatus, setMessages,error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  })


    const isSubmitted = chatStatus === "submitted"
    const isStreaming = chatStatus === "streaming"
    const isError    = chatStatus === "error"
    const isBusy     = isSubmitted || isStreaming

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return
    sendMessage({ text: message.text })
    setInput("")
  }

  function handleSuggestion(suggestion: string) {
    if(isBusy) return
    sendMessage({ text: suggestion })
  }

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="size-10 text-primary/60" />}
              title="CRM Assistant"
              description="Ask me anything about your pipeline, contacts, or deals."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    const key = `${message.id}-${i}`

                    // ── Text
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={key}>{part.text}</MessageResponse>
                      )
                    }

                    // ── CRM tool call
                    if (isCrmToolPart(part)) {
                      // `part` is now CrmToolUIPart — fully narrowed
                      const name = part.type.slice(5) as keyof CrmToolsMap
                      const isComplete =
                        part.state === "output-available" ||
                        part.state === "output-error"

                      return (
                        <Tool key={key} defaultOpen={isComplete}>
                          <ToolHeader
                            type={part.type}
                            state={part.state}
                            title={toolLabel(name)}
                          />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput
                              errorText={"errorText" in part ? (part.errorText as string | undefined) : undefined}
                              output={<CrmToolOutputUI part={part} />}
                            />
                          </ToolContent>
                        </Tool>
                      )
                    }

                    return null
                  })}
                </MessageContent>
              </Message>
            ))
          )}
            {isSubmitted && <ThinkingBubble />}
        </ConversationContent>
          {isStreaming && <StreamingBar />}
        <ConversationScrollButton />
      </Conversation>

       {isError && <ErrorBanner error={error} />}

      <div className="border-t p-4 space-y-3">
        {messages.length === 0 && (
          <Suggestions>
            {SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={handleSuggestion} />
            ))}
          </Suggestions>
        )}

        <div className="max-w-3xl mx-auto flex items-end gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              title="Clear conversation"
              onClick={() => setMessages([])}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <PromptInput onSubmit={handleSubmit} className="flex-1 relative">
            <PromptInputTextarea
              value={input}
              placeholder="Ask about your CRM… (Enter to send)"
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-12"
            />
            <PromptInputSubmit
              status={isStreaming ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-1.5 right-1.5"
            />
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
