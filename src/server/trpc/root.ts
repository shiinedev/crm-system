import { createTRPCRouter } from "./trpc"
import { companiesRouter } from "./routers/companies.router"
import { contactsRouter } from "./routers/contacts.router"
import { dealsRouter } from "./routers/deals.router"
import { pipelinesRouter } from "./routers/pipelines.router"
import { activitiesRouter } from "./routers/activities.router"
import { tasksRouter } from "./routers/tasks.router"
import { analyticsRouter } from "./routers/analytics.router"
import { notificationsRouter } from "./routers/notifications.router"
// import { documentsRouter } from "./routers/documents.router"

export const appRouter = createTRPCRouter({
    companies: companiesRouter,
    contacts: contactsRouter,
    deals: dealsRouter,
    pipelines: pipelinesRouter,
    activities: activitiesRouter,
    tasks: tasksRouter,
    analytics: analyticsRouter,
    notifications: notificationsRouter,
    // documents: documentsRouter,
})

export type AppRouter = typeof appRouter