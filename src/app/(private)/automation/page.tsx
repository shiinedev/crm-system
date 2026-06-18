"use client"

import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Plus, Zap, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkflowBuilder } from "@/modules/automation/components/workflow-builder"
import { toggleWorkflowAction, deleteWorkflowAction } from "@/server/actions/automation.actions"
import { formatRelativeTime } from "@/utils/format-date"
import type { AutomationWorkflow } from "@/db/schema"
import { useQuery } from "@tanstack/react-query"

const TRIGGER_LABELS: Record<string, string> = {
  "deal.stage.changed": "Deal stage changed",
  "deal.created": "Deal created",
  "contact.created": "Contact created",
  "task.due": "Task is due",
}

export default function AutomationPage() {
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editWorkflow, setEditWorkflow] = useState<AutomationWorkflow | undefined>()

  const trpc = useTRPC();

  const { data: workflows = [], isLoading } = useQuery(trpc.automation.list.queryOptions())

  const { execute: toggleWorkflow } = useAction(toggleWorkflowAction, {
    // onSuccess: () => void utils.automation.list.invalidate(),
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to toggle workflow"),
  })

  const { execute: deleteWorkflow } = useAction(deleteWorkflowAction, {
    onSuccess: () => {
      toast.success("Workflow deleted")
      // void utils.automation.list.invalidate()
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete workflow"),
  })

  function handleEdit(workflow: AutomationWorkflow) {
    setEditWorkflow(workflow)
    setBuilderOpen(true)
  }

  function handleCreate() {
    setEditWorkflow(undefined)
    setBuilderOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Automation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trigger actions automatically when events occur</p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />New workflow
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading...</div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Zap className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No workflows yet</p>
            <Button size="sm" variant="outline" onClick={handleCreate}>Create your first workflow</Button>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {workflows.map((workflow) => {
              const trigger = JSON.parse(workflow.trigger) as { type: string }
              const actions = JSON.parse(workflow.actions) as Array<{ type: string }>

              return (
                <div key={workflow.id} className="flex items-start gap-4 rounded-xl border bg-card p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{workflow.name}</p>
                      {!workflow.isActive && (
                        <Badge variant="outline" className="text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {TRIGGER_LABELS[trigger.type] ?? trigger.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs text-muted-foreground">
                        {actions.length} action{actions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {workflow.lastRunAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last run {formatRelativeTime(workflow.lastRunAt)} · {workflow.runCount} total runs
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={workflow.isActive ?? false}
                      onCheckedChange={(checked) => toggleWorkflow({ id: workflow.id, isActive: checked })}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(workflow)}>
                          <Pencil className="h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteWorkflow({ id: workflow.id })}
                        >
                          <Trash2 className="h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <WorkflowBuilder open={builderOpen} onOpenChange={setBuilderOpen} workflow={editWorkflow} />
    </div>
  )
}
