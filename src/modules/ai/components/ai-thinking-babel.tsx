import { Message, MessageContent } from "@/components/ai-elements/message";

export function ThinkingBubble() {
  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex items-center gap-1.5 px-1 py-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
            />
          ))}
        </div>
      </MessageContent>
    </Message>
  )
}
