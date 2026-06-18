import { serve } from "inngest/next"
import { inngest } from "@/server/inngest/client"
import { automationRunner } from "@/server/inngest/functions/automation-runner"
import { taskReminder } from "@/server/inngest/functions/task-reminder"
import { leadScorer } from "@/server/inngest/functions/lead-scorer"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [automationRunner, taskReminder, leadScorer],
})
