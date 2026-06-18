import { PipelineBuilder } from "@/modules/pipelines/components/pipeline-builder"
import { Metadata } from "next"

export const metadata:Metadata = { title: "Pipelines" }

export default function PipelinesSettingsPage() {
  return <PipelineBuilder />
}
