"use client"

import { useState, type SetStateAction, type Dispatch } from "react"
import { Controller, useForm, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTRPC } from "@/lib/trpc/client"
import { useAction } from "next-safe-action/hooks"
// import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, GripVertical, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Field, FieldGroup, FieldContent, FieldError,FieldLabel,
} from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  createPipelineAction,
  createPipelineStageAction,
  deletePipelineStageAction,
  deletePipelineAction,
} from "@/server/actions/pipeline.actions"
import { useQuery } from "@tanstack/react-query"
import { Pipeline } from "@/db/schema"

const pipelineSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  probability: z.string().optional(),
})

type PipelineValues = z.infer<typeof pipelineSchema>
type StageValues = z.infer<typeof stageSchema>

export function PipelineBuilder() {
  // const router = useRouter();

  const trpc = useTRPC()
  const [newPipelineOpen, setNewPipelineOpen] = useState(false)
  const [addingStageToId, setAddingStageToId] = useState<string | null>(null)

  const { data: pipelines = [], refetch } = useQuery(trpc.pipelines.list.queryOptions())

  const { execute: createPipeline, isPending: isCreatingPipeline } = useAction(createPipelineAction, {
    onSuccess: () => { toast.success("Pipeline created"); refetch(); setNewPipelineOpen(false) },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to create pipeline"),
  })

  const { execute: createStage, isPending: isCreatingStage } = useAction(createPipelineStageAction, {
    onSuccess: () => { toast.success("Stage added"); refetch(); setAddingStageToId(null) },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to add stage"),
  })

  const { execute: deleteStage } = useAction(deletePipelineStageAction, {
    onSuccess: () => { toast.success("Stage removed"); refetch() },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to remove stage"),
  })

  const { execute: deletePipeline } = useAction(deletePipelineAction, {
    onSuccess: () => { toast.success("Pipeline deleted"); refetch() },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to delete pipeline"),
  })

  const pipelineForm = useForm<PipelineValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: { name: "" },
  })

  const stageForm = useForm<StageValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: { name: "", probability: undefined },
  })

  function onCreatePipeline(values: PipelineValues) {
    createPipeline({ name: values.name })
    pipelineForm.reset()
  }

  function onAddStage(pipelineId: string, currentCount: number) {
    const values = stageForm.getValues()
    if (!values.name) { stageForm.setError("name", { message: "Required" }); return }
    createStage({
      pipelineId,
      name: values.name,
      order: currentCount,
      probability: values.probability ? Number(values.probability) : undefined,
    })
    stageForm.reset()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Pipelines</h2>
          <p className="text-sm text-muted-foreground">Configure your sales pipelines and stages.</p>
        </div>
        <Button size="sm" onClick={() => setNewPipelineOpen(true)}>
          <Plus className="h-4 w-4" />New pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm text-muted-foreground">No pipelines yet.</p>
            <Button size="sm" variant="outline" onClick={() => setNewPipelineOpen(true)}>
              Create your first pipeline
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              addingStageToId={addingStageToId}
              setAddingStageToId={setAddingStageToId}
              stageForm={stageForm}
              isCreatingStage={isCreatingStage}
              onAddStage={onAddStage}
              onDeleteStage={(id: string) => deleteStage({ id })}
              onDeletePipeline={(id: string) => deletePipeline({ id })}
            />
          ))}
        </div>
      )}

      {/* New pipeline dialog */}
      <Dialog open={newPipelineOpen} onOpenChange={setNewPipelineOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New pipeline</DialogTitle>
          </DialogHeader>
          <form onSubmit={pipelineForm.handleSubmit(onCreatePipeline)} className="space-y-4">
            <FieldGroup>
              <Controller control={pipelineForm.control} name="name" render={({ field ,fieldState})=> (
                <Field >
                  <FieldLabel>Pipeline name *</FieldLabel>
                  <FieldContent><Input placeholder="Sales Pipeline" data-invalid={fieldState.invalid} {...field} /></FieldContent>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field >
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNewPipelineOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreatingPipeline}>
                  {isCreatingPipeline ? "Creating..." : "Create pipeline"}
                </Button>
              </DialogFooter>
            </FieldGroup>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Pipeline card
//
//
type PipelineCardProps = {
  pipeline: Pipeline
  addingStageToId:string | null
  setAddingStageToId: Dispatch<SetStateAction<string | null>>
  stageForm:UseFormReturn<{
      name: string;
      probability?: string | undefined;
  }, any, {
      name: string;
      probability?: string | undefined;
  }>
  isCreatingStage:boolean
  onAddStage: (pipelineId: string, currentCount: number) => void
  onDeleteStage:(id: string) => void
  onDeletePipeline: (pipelineId: string) => void
 }
function PipelineCard({
  pipeline, addingStageToId, setAddingStageToId,
  stageForm, isCreatingStage, onAddStage, onDeleteStage, onDeletePipeline,
}: PipelineCardProps) {

  const trpc = useTRPC();
  const { data: pipelineWithStages } = useQuery(trpc.pipelines.getWithStages.queryOptions(
    { id: pipeline.id }
  ))
  const stages = pipelineWithStages?.stages ?? []

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">{pipeline.name}</CardTitle>
          {pipeline.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={() => onDeletePipeline(pipeline.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />Delete
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {/* Stages */}
        <div className="divide-y">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 px-4 py-2.5 group">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-sm flex-1">{stage.name}</span>
              {stage.probability != null && (
                <span className="text-xs text-muted-foreground">{stage.probability}%</span>
              )}
              {stage.isWon && <Badge variant="success" className="text-xs">Won</Badge>}
              {stage.isLost && <Badge variant="destructive" className="text-xs">Lost</Badge>}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteStage(stage.id as string)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add stage inline */}
        {addingStageToId === pipeline.id ? (
          <div className="px-4 py-3 border-t flex items-end gap-2">
              <FieldGroup>
              <div className="flex gap-2 flex-1">
                <Controller control={stageForm.control} name="name" render={({ field,fieldState }) => (
                  <Field  className="flex-1" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <Input className="h-8 text-sm" placeholder="Stage name" data-invalid={fieldState.invalid} {...field} autoFocus />
                    </FieldContent>
                    {fieldState.error &&<FieldError errors={[fieldState.error]} />}
                  </Field >
                )} />
                <Controller control={stageForm.control} name="probability" render={({ field,fieldState }) => (
                  <Field  data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <Input
                        className="h-8 text-sm"
                        placeholder="0-100%"
                        type="number"
                        data-invalid={fieldState.invalid}
                        min={0}
                        max={100}
                        {...field}
                      />
                    </FieldContent>
                  </Field >
                )} />
              </div>
              </FieldGroup>
            <Button
              size="sm"
              className="h-8 shrink-0"
              disabled={isCreatingStage}
              onClick={() => onAddStage(pipeline.id, stages.length)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 shrink-0"
              onClick={() => { setAddingStageToId(null); stageForm.reset() }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="px-4 py-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground gap-1.5"
              onClick={() => { setAddingStageToId(pipeline.id); stageForm.reset() }}
            >
              <Plus className="h-3.5 w-3.5" />Add stage
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
