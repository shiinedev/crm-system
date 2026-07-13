import { inngest, sendEvent, taskDueEvent } from "../client"
import { getTaskById, getTasksDueBetween } from "@/db/queries/tasks.queries"
import { createNotification } from "@/db/queries/notifications.queries"

const SCAN_INTERVAL_MINUTES = 15

/**
 * Cron: every 15 minutes, find open tasks whose reminder/due time fell in
 * the last window and emit crm/task.due for each. The event then fans out
 * to the reminder notification below and to task.due automation workflows.
 */
export const taskDueScanner = inngest.createFunction(
  {
    id: "task-due-scanner",
    triggers: [{ cron: `*/${SCAN_INTERVAL_MINUTES} * * * *` }],
  },
  async () => {
    const end = new Date()
    const start = new Date(end.getTime() - SCAN_INTERVAL_MINUTES * 60 * 1000)

    const dueTasks = await getTasksDueBetween(start, end)

    await Promise.all(
      dueTasks
        .filter((task) => task.assignedToId)
        .map((task) =>
          sendEvent(
            taskDueEvent.create({
              taskId: task.id,
              orgId: task.organizationId,
              assignedToId: task.assignedToId!,
            })
          )
        )
    )

    return { scanned: dueTasks.length }
  }
)

export const taskReminder = inngest.createFunction(
  {
    id: "task-reminder",
    triggers: [taskDueEvent],
  },
  async ({ event }) => {
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
