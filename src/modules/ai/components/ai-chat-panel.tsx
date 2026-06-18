"use client"

/**
 * TEMPORARY fallback — replace with AI Elements once you run locally:
 *   npx ai-elements@latest add message conversation prompt-input suggestion
 * See: https://elements.ai-sdk.dev
 */

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Streamdown } from 'streamdown';

const SUGGESTIONS = [
  "How many open deals do I have?",
  "Which contacts have the highest lead score?",
  "Summarize my pipeline health",
  "What tasks are overdue?",
]

export function AIChatPanel() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  })
  const isStreaming = status === "streaming" || status === "submitted"
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function submit(text: string) {
    if (!text.trim()) return
    sendMessage({ text })
    setInput("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">CRM Assistant</p>
                <p className="text-sm text-muted-foreground mt-0.5">Ask me anything about your pipeline, contacts, or deals.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="text-xs px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-left text-muted-foreground"
                    onClick={() => submit(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={cn(
                "rounded-xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {message.parts.map((part, i) =>
                  part.type === "text" ? <Streamdown key={i}>{part.text}</Streamdown> : null
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => setMessages([])}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your CRM… (Enter to send)"
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-[120px]"
          />
          <Button size="icon" onClick={() => submit(input)} disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
