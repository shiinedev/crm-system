"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTRPC } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"

type AIAction = "analyzeDeal" | "summarizeCompany" | "scoreLead" | "generateEmail"

interface AIActionButtonProps {
  action: AIAction
  resourceId: string
  onSuccess?: (result: string) => void
  label?: string
  className?: string
}

const ACTION_CONFIG: Record<AIAction, { label: string; successKey: string }> = {
  analyzeDeal:       { label: "Analyze risk",    successKey: "analysis" },
  summarizeCompany:  { label: "AI summary",      successKey: "summary" },
  scoreLead:         { label: "Score lead",       successKey: "score" },
  generateEmail:     { label: "Draft email",      successKey: "email" },
}

export function AIActionButton({ action, resourceId, onSuccess, label, className }: AIActionButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const trpc = useTRPC()
  const config = ACTION_CONFIG[action]

  const analyzeDeal      = useMutation(trpc.ai.analyzeDeal.mutationOptions())
  const summarizeCompany = useMutation(trpc.ai.summarizeCompany.mutationOptions())
  const scoreLead        = useMutation(trpc.ai.scoreLead.mutationOptions())
  const generateEmail = useMutation(trpc.ai.generateEmail.mutationOptions());

  async function handleClick() {
    setIsRunning(true)
    try {
      let result: string | number = ""

      if (action === "analyzeDeal") {
        const res = await analyzeDeal.mutateAsync({ dealId: resourceId })
        result = res.analysis

      } else if (action === "summarizeCompany") {
        const res = await summarizeCompany.mutateAsync({ companyId: resourceId })
        result = res.summary
      } else if (action === "scoreLead") {
        const res = await scoreLead.mutateAsync({ contactId: resourceId })
        result = String(res.score)
      } else if (action === "generateEmail") {
        const res = await generateEmail.mutateAsync({ contactId: resourceId })
        result = res.email
      }

      toast.success(`${config.label} complete`)
      onSuccess?.(String(result))
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to run ${config.label}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={handleClick}
      disabled={isRunning}
    >
      {isRunning
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Sparkles className="h-3.5 w-3.5 text-violet-500" />
      }
      {label ?? config.label}
    </Button>
  )
}
