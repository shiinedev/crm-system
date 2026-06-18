import { inngest } from "../client"
import { getTaskById } from "@/db/queries/tasks.queries"
import { createNotification } from "@/db/queries/notifications.queries"

export const taskReminder = inngest.createFunction(
  {
    id: "task-reminder",
    triggers: [{ event: "crm/task.due" }],
  },
  async ({ event }: { event: { data: { taskId: string; orgId: string; assignedToId: string } } }) => {
    const { taskId, orgId, assignedToId } = event.data
    const task = await getTaskById(taskId, orgId)
    if (!task || task.status === "done" || task.status === "cancelled") return

    await createNotification({
      organizationId: orgId,
      userId: assignedToId,
      type: "task_due",
      title: "Task due",
      body: `"${task.title}" is due now.`,
      metadata: JSON.stringify({ taskId }),
    })
  }
)
