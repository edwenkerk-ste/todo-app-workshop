import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { normalizePriority } from './priority'

export type Priority = 'high' | 'medium' | 'low'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Todo {
  id: string
  title: string
  due_date: string | null
  priority: Priority
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  reminder_minutes: number | null
  last_notification_sent: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface TodoTag {
  todo_id: string
  tag_id: string
}

export interface Subtask {
  id: string
  todo_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
  updated_at: string
}

const db = new Database('todos.db')

db.pragma('foreign_keys = ON')

// Ensure schema exists
// Due date is stored as ISO string UTC (e.g. 2026-03-11T10:00:00.000Z)
// completed is 0/1
// priority is one of 'high', 'medium', 'low'

db.exec(`
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  due_date TEXT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT NULL,
  reminder_minutes INTEGER NULL,
  last_notification_sent TEXT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON todos(due_date);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON todos(completed);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6b7280'
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
`)

// Migration for existing databases that predate recurring fields.
try {
  db.exec(`ALTER TABLE todos ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;`)
} catch {
  // Column already exists.
}

try {
  db.exec(`ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT NULL;`)
} catch {
  // Column already exists.
}

try {
  db.exec(`ALTER TABLE todos ADD COLUMN reminder_minutes INTEGER NULL;`)
} catch {
  // Column already exists.
}

try {
  db.exec(`ALTER TABLE todos ADD COLUMN last_notification_sent TEXT NULL;`)
} catch {
  // Column already exists.
}

// Index for reminder polling (after columns exist)
try {
  db.exec(`CREATE INDEX IF NOT EXISTS todos_reminder_idx ON todos(completed, due_date, reminder_minutes);`)
} catch {
  // Index already exists or table shape issue
}

// Migration: add color to tags if table existed with old schema (created_at/updated_at)
try {
  db.exec(`ALTER TABLE tags ADD COLUMN color TEXT NOT NULL DEFAULT '#6b7280';`)
} catch {
  // Column already exists or table has new schema
}

// Tags (many-to-many with todos)
db.exec(`
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6b7280'
);
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);
CREATE INDEX IF NOT EXISTS todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS todo_tags_tag_id ON todo_tags(tag_id);
`)

export function getAllTodos(): Todo[] {
  const stmt = db.prepare(`
    SELECT * FROM todos
    ORDER BY
      completed ASC,
      CASE priority
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 0
      END DESC,
      due_date ASC,
      created_at ASC
  `)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    due_date: row.due_date === null ? null : String(row.due_date),
    priority: normalizePriority(row.priority),
    is_recurring: Boolean(row.is_recurring),
    recurrence_pattern: row.recurrence_pattern === null ? null : String(row.recurrence_pattern) as RecurrencePattern,
    reminder_minutes: row.reminder_minutes === null || row.reminder_minutes === undefined
      ? null
      : Number(row.reminder_minutes),
    last_notification_sent: row.last_notification_sent === null || row.last_notification_sent === undefined
      ? null
      : String(row.last_notification_sent),
    completed: Boolean(row.completed),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))
}

export function getTodoById(id: string): Todo | null {
  const stmt = db.prepare(`SELECT * FROM todos WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    title: String(row.title),
    due_date: row.due_date === null ? null : String(row.due_date),
    priority: normalizePriority(row.priority),
    is_recurring: Boolean(row.is_recurring),
    recurrence_pattern: row.recurrence_pattern === null ? null : String(row.recurrence_pattern) as RecurrencePattern,
    reminder_minutes: row.reminder_minutes === null || row.reminder_minutes === undefined
      ? null
      : Number(row.reminder_minutes),
    last_notification_sent: row.last_notification_sent === null || row.last_notification_sent === undefined
      ? null
      : String(row.last_notification_sent),
    completed: Boolean(row.completed),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export function createTodo(data: {
  title: string
  due_date: string | null
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  last_notification_sent?: string | null
}): Todo {
  const now = new Date().toISOString()
  const isRecurring = Boolean(data.is_recurring)
  const recurrencePattern = isRecurring ? (data.recurrence_pattern ?? null) : null
  const todo: Todo = {
    id: uuidv4(),
    title: data.title.trim(),
    due_date: data.due_date,
    priority: normalizePriority(data.priority),
    is_recurring: isRecurring,
    recurrence_pattern: recurrencePattern,
    reminder_minutes: data.reminder_minutes ?? null,
    last_notification_sent: data.last_notification_sent ?? null,
    completed: false,
    created_at: now,
    updated_at: now,
  }
  const stmt = db.prepare(
    `INSERT INTO todos (id, title, due_date, priority, is_recurring, recurrence_pattern, reminder_minutes, last_notification_sent, completed, created_at, updated_at)
      VALUES (@id, @title, @due_date, @priority, @is_recurring, @recurrence_pattern, @reminder_minutes, @last_notification_sent, @completed, @created_at, @updated_at)`
  )
  stmt.run({
    id: todo.id,
    title: todo.title,
    due_date: todo.due_date,
    priority: todo.priority,
    is_recurring: todo.is_recurring ? 1 : 0,
    recurrence_pattern: todo.recurrence_pattern,
    reminder_minutes: todo.reminder_minutes,
    last_notification_sent: todo.last_notification_sent,
    completed: 0,
    created_at: todo.created_at,
    updated_at: todo.updated_at,
  })
  return todo
}

export function updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'created_at'>>): Todo | null {
  const existing = getTodoById(id)
  if (!existing) return null
  const now = new Date().toISOString()
  const hasReminderMinutes = Object.prototype.hasOwnProperty.call(updates, 'reminder_minutes')
  const hasLastNotificationSent = Object.prototype.hasOwnProperty.call(updates, 'last_notification_sent')
  const nextRecurringValue = updates.is_recurring ?? existing.is_recurring
  const nextPatternValue = nextRecurringValue
    ? (updates.recurrence_pattern ?? existing.recurrence_pattern)
    : null
  const updated: Todo = {
    ...existing,
    ...updates,
    priority: normalizePriority(updates.priority ?? existing.priority),
    is_recurring: nextRecurringValue,
    recurrence_pattern: nextPatternValue,
    reminder_minutes: hasReminderMinutes ? (updates.reminder_minutes ?? null) : existing.reminder_minutes,
    last_notification_sent: hasLastNotificationSent ? (updates.last_notification_sent ?? null) : existing.last_notification_sent,
    updated_at: now,
  }
  const stmt = db.prepare(
    `UPDATE todos
      SET title = @title,
          due_date = @due_date,
          priority = @priority,
          is_recurring = @is_recurring,
          recurrence_pattern = @recurrence_pattern,
          reminder_minutes = @reminder_minutes,
          last_notification_sent = @last_notification_sent,
          completed = @completed,
          updated_at = @updated_at
      WHERE id = @id`
  )
  stmt.run({
    id,
    title: updated.title,
    due_date: updated.due_date,
    priority: updated.priority,
    is_recurring: updated.is_recurring ? 1 : 0,
    recurrence_pattern: updated.recurrence_pattern,
    reminder_minutes: updated.reminder_minutes,
    last_notification_sent: updated.last_notification_sent,
    completed: updated.completed ? 1 : 0,
    updated_at: updated.updated_at,
  })
  return updated
}

export function deleteTodo(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM todos WHERE id = ?`)
  const result = stmt.run(id)
  return result.changes > 0
}

export function claimReminderNotification(id: string, sentAtIso: string): Todo | null {
  const stmt = db.prepare(
    `UPDATE todos
      SET last_notification_sent = @last_notification_sent,
          updated_at = @updated_at
      WHERE id = @id
        AND last_notification_sent IS NULL`
  )
  const result = stmt.run({
    id,
    last_notification_sent: sentAtIso,
    updated_at: sentAtIso,
  })
  if (result.changes === 0) {
    return null
  }
  return getTodoById(id)
}

// --- Tags ---

export function getAllTags(): Tag[] {
  const stmt = db.prepare(`SELECT id, name, color FROM tags ORDER BY name ASC`)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
  }))
}

export function getTagById(id: string): Tag | null {
  const stmt = db.prepare(`SELECT id, name, color FROM tags WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
  }
}

export function getTagByName(name: string): Tag | null {
  const stmt = db.prepare(`SELECT id, name, color FROM tags WHERE name = ?`)
  const row = stmt.get(name.trim()) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
  }
}

export function createTag(data: { name: string; color?: string }): Tag {
  const id = uuidv4()
  const name = data.name.trim()
  const color = (data.color && /^#[0-9A-Fa-f]{6}$/.test(data.color)) ? data.color : '#6b7280'
  const stmt = db.prepare(`INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`)
  stmt.run(id, name, color)
  return { id, name, color }
}

export function updateTag(id: string, updates: { name?: string; color?: string }): Tag | null {
  const existing = getTagById(id)
  if (!existing) return null
  const name = updates.name !== undefined ? updates.name.trim() : existing.name
  const color =
    updates.color !== undefined && /^#[0-9A-Fa-f]{6}$/.test(updates.color)
      ? updates.color
      : existing.color
  const stmt = db.prepare(`UPDATE tags SET name = ?, color = ? WHERE id = ?`)
  stmt.run(name, color, id)
  return { id, name, color }
}

export function deleteTag(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM tags WHERE id = ?`)
  const result = stmt.run(id)
  return result.changes > 0
}

export function getTagsForTodo(todoId: string): Tag[] {
  const stmt = db.prepare(`
    SELECT t.id, t.name, t.color
    FROM tags t
    INNER JOIN todo_tags tt ON tt.tag_id = t.id
    WHERE tt.todo_id = ?
    ORDER BY t.name ASC
  `)
  const rows = stmt.all(todoId) as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
  }))
}

export function setTodoTags(todoId: string, tagIds: string[]): void {
  const del = db.prepare(`DELETE FROM todo_tags WHERE todo_id = ?`)
  del.run(todoId)
  if (tagIds.length === 0) return
  const insert = db.prepare(`INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)`)
  for (const tagId of tagIds) {
    insert.run(todoId, tagId)
  }
}

export function addTodoTag(todoId: string, tagId: string): void {
  const stmt = db.prepare(`INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)`)
  stmt.run(todoId, tagId)
}

export function removeTodoTag(todoId: string, tagId: string): void {
  const stmt = db.prepare(`DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?`)
  stmt.run(todoId, tagId)
}

export function getAllTodoTags(): TodoTag[] {
  const stmt = db.prepare(`SELECT todo_id, tag_id FROM todo_tags`)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map((row) => ({
    todo_id: String(row.todo_id),
    tag_id: String(row.tag_id),
  }))
}

export function getSubtasksByTodoId(todoId: string): Subtask[] {
  const stmt = db.prepare(`SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC`)
  const rows = stmt.all(todoId) as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    todo_id: String(row.todo_id),
    title: String(row.title),
    completed: Boolean(row.completed),
    position: Number(row.position),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))
}

export function createSubtask(data: {
  todo_id: string
  title: string
  completed?: boolean
  position?: number
  created_at?: string
  updated_at?: string
}): Subtask {
  const now = new Date().toISOString()
  const subtask: Subtask = {
    id: uuidv4(),
    todo_id: data.todo_id,
    title: data.title.trim(),
    completed: Boolean(data.completed),
    position: data.position ?? 0,
    created_at: data.created_at ?? now,
    updated_at: data.updated_at ?? now,
  }
  const stmt = db.prepare(
    `INSERT INTO subtasks (id, todo_id, title, completed, position, created_at, updated_at)
      VALUES (@id, @todo_id, @title, @completed, @position, @created_at, @updated_at)`
  )
  stmt.run({
    id: subtask.id,
    todo_id: subtask.todo_id,
    title: subtask.title,
    completed: subtask.completed ? 1 : 0,
    position: subtask.position,
    created_at: subtask.created_at,
    updated_at: subtask.updated_at,
  })
  return subtask
}

export function getAllSubtasks(): Subtask[] {
  const stmt = db.prepare(`SELECT * FROM subtasks ORDER BY todo_id ASC, position ASC`)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    todo_id: String(row.todo_id),
    title: String(row.title),
    completed: Boolean(row.completed),
    position: Number(row.position),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))
}

export function exportAllData() {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    todos: getAllTodos(),
    tags: getAllTags(),
    todo_tags: getAllTodoTags(),
    subtasks: getAllSubtasks(),
  }
}

export function importBackup(data: {
  version: number
  todos?: Array<Partial<Todo> & { id: string }>
  tags?: Array<Partial<Tag> & { id: string }>
  todo_tags?: Array<Partial<TodoTag> & { todo_id: string; tag_id: string }>
  subtasks?: Array<Partial<Subtask> & { id: string; todo_id: string }>
}) {
  if (data.version !== 1) {
    throw new Error('Unsupported export version')
  }

  const now = new Date().toISOString()
  const todoIdMap = new Map<string, string>()
  const tagIdMap = new Map<string, string>()

  // Import tags: reuse existing when name conflict
  ;(data.tags ?? []).forEach((tag) => {
    const name = tag.name?.trim() ?? ''
    if (!name) return
    const existing = getTagByName(name)
    if (existing) {
      tagIdMap.set(tag.id, existing.id)
      return
    }
    const color = (tag as { color?: string }).color && /^#[0-9A-Fa-f]{6}$/.test((tag as { color?: string }).color!)
      ? (tag as { color?: string }).color!
      : '#6b7280'
    const created = createTag({ name, color })
    tagIdMap.set(tag.id, created.id)
  })

  // Import todos
  ;(data.todos ?? []).forEach((todo) => {
    const created = createTodo({
      title: todo.title ?? 'Untitled',
      due_date: todo.due_date ?? null,
      priority: todo.priority ?? 'medium',
      is_recurring: todo.is_recurring ?? false,
      recurrence_pattern: todo.recurrence_pattern ?? null,
    })
    if (todo.created_at || todo.updated_at) {
      const stmt = db.prepare(`UPDATE todos SET created_at = @created_at, updated_at = @updated_at WHERE id = @id`)
      stmt.run({
        id: created.id,
        created_at: todo.created_at ?? created.created_at,
        updated_at: todo.updated_at ?? created.updated_at,
      })
    }
    todoIdMap.set(todo.id, created.id)
  })

  // Import subtasks
  ;(data.subtasks ?? []).forEach((subtask) => {
    const mappedTodoId = todoIdMap.get(subtask.todo_id)
    if (!mappedTodoId) return
    createSubtask({
      todo_id: mappedTodoId,
      title: subtask.title ?? 'Subtask',
      completed: subtask.completed ?? false,
      position: subtask.position ?? 0,
      created_at: subtask.created_at ?? now,
      updated_at: subtask.updated_at ?? now,
    })
  })

  // Import todo-tags associations
  ;(data.todo_tags ?? []).forEach((assoc) => {
    const mappedTodoId = todoIdMap.get(assoc.todo_id)
    const mappedTagId = tagIdMap.get(assoc.tag_id)
    if (!mappedTodoId || !mappedTagId) return
    addTodoTag(mappedTodoId, mappedTagId)
  })

  return {
    imported: {
      todos: todoIdMap.size,
      tags: tagIdMap.size,
      subtasks: (data.subtasks ?? []).length,
      associations: (data.todo_tags ?? []).length,
    },
  }
}
