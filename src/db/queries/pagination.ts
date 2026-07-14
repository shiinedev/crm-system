import { and, eq, lt, or, type SQL } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

/** Keyset cursor for lists ordered by (createdAt DESC, id DESC) */
export type PageCursor = { createdAt: Date; id: string }

export type PageOpts = { limit?: number; cursor?: PageCursor }

/**
 * WHERE fragment selecting rows strictly after the cursor in
 * (createdAt DESC, id DESC) order. Returns undefined when no cursor,
 * which `and(...)` ignores.
 */
export function afterCursor(
  createdAt: AnyPgColumn,
  id: AnyPgColumn,
  cursor?: PageCursor
): SQL | undefined {
  if (!cursor) return undefined
  return or(
    lt(createdAt, cursor.createdAt),
    and(eq(createdAt, cursor.createdAt), lt(id, cursor.id))
  )
}

/**
 * Slice a limit+1 result set into a page: `items` capped at `limit`,
 * plus the cursor for the next page (null when this is the last page).
 */
export function toPage<T extends { createdAt: Date; id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit)
  const last = items[items.length - 1]
  const nextCursor =
    rows.length > limit && last ? { createdAt: last.createdAt, id: last.id } : null
  return { items, nextCursor }
}
