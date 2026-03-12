import fs from 'fs'
import path from 'path'
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

export interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  title_template: string
  priority: Priority
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  reminder_minutes: number | null
  subtasks_json: string | null
  due_date_offset_days: number | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  created_at: string
}

export interface Authenticator {
  id: string
  user_id: string
  credential_id: string
  credential_public_key: string
  counter: number
  transports: string | null
  created_at: string
}

const dbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || process.cwd(), 'todos.db')
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}
const db = new Database(dbPath)

// Enable foreign key enforcement for CASCADE delete
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

// Subtasks table
db.exec(`
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS subtasks_todo_id ON subtasks(todo_id);
`)

// Templates table
db.exec(`
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NULL,
  category TEXT NULL,
  title_template TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_pattern TEXT NULL,
  reminder_minutes INTEGER NULL,
  subtasks_json TEXT NULL,
  due_date_offset_days INTEGER NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`)

// Users and authenticators tables for WebAuthn
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS authenticators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS authenticators_user_id ON authenticators(user_id);
CREATE INDEX IF NOT EXISTS authenticators_credential_id ON authenticators(credential_id);
`)

// Migration: add user_id to todos for multi-user support
try {
  db.exec(`ALTER TABLE todos ADD COLUMN user_id TEXT NULL;`)
} catch {
  // Column already exists
}
try {
  db.exec(`CREATE INDEX IF NOT EXISTS todos_user_id ON todos(user_id);`)
} catch {
  // Index already exists
}

// Migration: add user_id to templates for multi-user support
try {
  db.exec(`ALTER TABLE templates ADD COLUMN user_id TEXT NULL;`)
} catch {
  // Column already exists
}

export function getAllTodos(userId?: string): Todo[] {
  const sql = `
    SELECT * FROM todos
    ${userId ? 'WHERE user_id = ?' : ''}
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
  `
  const stmt = db.prepare(sql)
  const rows = (userId ? stmt.all(userId) : stmt.all()) as Array<Record<string, unknown>>
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
  user_id?: string | null
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
    `INSERT INTO todos (id, title, due_date, priority, is_recurring, recurrence_pattern, reminder_minutes, last_notification_sent, completed, created_at, updated_at, user_id)
      VALUES (@id, @title, @due_date, @priority, @is_recurring, @recurrence_pattern, @reminder_minutes, @last_notification_sent, @completed, @created_at, @updated_at, @user_id)`
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
    user_id: data.user_id ?? null,
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

// --- Subtasks ---

function mapSubtaskRow(row: Record<string, unknown>): Subtask {
  return {
    id: String(row.id),
    todo_id: String(row.todo_id),
    title: String(row.title),
    completed: Boolean(row.completed),
    position: Number(row.position ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export function getSubtasksByTodoId(todoId: string): Subtask[] {
  const stmt = db.prepare(`SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, created_at ASC`)
  const rows = stmt.all(todoId) as Array<Record<string, unknown>>
  return rows.map(mapSubtaskRow)
}

export function getSubtaskById(id: string): Subtask | null {
  const stmt = db.prepare(`SELECT * FROM subtasks WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return mapSubtaskRow(row)
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
  const position =
    data.position ??
    (Number(
      (db.prepare(`SELECT COALESCE(MAX(position), -1) AS mp FROM subtasks WHERE todo_id = ?`).get(data.todo_id) as Record<string, unknown>)?.mp ?? -1
    ) + 1)
  const created_at = data.created_at ?? now
  const updated_at = data.updated_at ?? now
  const subtask: Subtask = {
    id: uuidv4(),
    todo_id: data.todo_id,
    title: data.title.trim(),
    completed: Boolean(data.completed),
    position,
    created_at,
    updated_at,
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
  return rows.map(mapSubtaskRow)
}

export function updateSubtask(id: string, updates: { title?: string; completed?: boolean; position?: number }): Subtask | null {
  const existing = getSubtaskById(id)
  if (!existing) return null
  const now = new Date().toISOString()
  const updated: Subtask = {
    ...existing,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    completed: updates.completed !== undefined ? updates.completed : existing.completed,
    position: updates.position !== undefined ? updates.position : existing.position,
    updated_at: now,
  }
  const stmt = db.prepare(
    `UPDATE subtasks SET title = @title, completed = @completed, position = @position, updated_at = @updated_at WHERE id = @id`
  )
  stmt.run({ id, title: updated.title, completed: updated.completed ? 1 : 0, position: updated.position, updated_at: now })
  return updated
}

export function deleteSubtask(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM subtasks WHERE id = ?`)
  const result = stmt.run(id)
  return result.changes > 0
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

/** Input shape for import (e.g. from JSON/Zod); priority and recurrence_pattern may be strings. */
export function importBackup(data: {
  version: number
  todos?: Array<{
    id: string
    title?: string
    due_date?: string | null
    priority?: string
    is_recurring?: boolean
    recurrence_pattern?: string | null
    completed?: boolean
    created_at?: string
    updated_at?: string
  }>
  tags?: Array<Partial<Tag> & { id: string }>
  todo_tags?: Array<Partial<TodoTag> & { todo_id: string; tag_id: string }>
  subtasks?: Array<Partial<Subtask> & { id: string; todo_id: string }>
}) {
  if (data.version !== 1) {
    throw new Error('Unsupported export version')
  }

  const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly']
  const normalizeRecurrence = (p: string | null | undefined): RecurrencePattern | null =>
    p && validPatterns.includes(p as RecurrencePattern) ? (p as RecurrencePattern) : null

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
      priority: normalizePriority(todo.priority),
      is_recurring: todo.is_recurring ?? false,
      recurrence_pattern: normalizeRecurrence(todo.recurrence_pattern ?? undefined),
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

// --- Templates ---

function mapTemplateRow(row: Record<string, unknown>): Template {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description === null || row.description === undefined ? null : String(row.description),
    category: row.category === null || row.category === undefined ? null : String(row.category),
    title_template: String(row.title_template),
    priority: normalizePriority(row.priority),
    is_recurring: Boolean(row.is_recurring),
    recurrence_pattern: row.recurrence_pattern === null ? null : String(row.recurrence_pattern) as RecurrencePattern,
    reminder_minutes: row.reminder_minutes === null || row.reminder_minutes === undefined ? null : Number(row.reminder_minutes),
    subtasks_json: row.subtasks_json === null || row.subtasks_json === undefined ? null : String(row.subtasks_json),
    due_date_offset_days: row.due_date_offset_days === null || row.due_date_offset_days === undefined ? null : Number(row.due_date_offset_days),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export function getAllTemplates(): Template[] {
  const stmt = db.prepare(`SELECT * FROM templates ORDER BY name ASC`)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map(mapTemplateRow)
}

export function getTemplateById(id: string): Template | null {
  const stmt = db.prepare(`SELECT * FROM templates WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return mapTemplateRow(row)
}

export function createTemplate(data: {
  name: string
  description?: string | null
  category?: string | null
  title_template: string
  priority?: Priority
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern | null
  reminder_minutes?: number | null
  subtasks_json?: string | null
  due_date_offset_days?: number | null
}): Template {
  const now = new Date().toISOString()
  const isRecurring = Boolean(data.is_recurring)
  const template: Template = {
    id: uuidv4(),
    name: data.name.trim(),
    description: data.description?.trim() || null,
    category: data.category?.trim() || null,
    title_template: data.title_template.trim(),
    priority: normalizePriority(data.priority),
    is_recurring: isRecurring,
    recurrence_pattern: isRecurring ? (data.recurrence_pattern ?? null) : null,
    reminder_minutes: data.reminder_minutes ?? null,
    subtasks_json: data.subtasks_json ?? null,
    due_date_offset_days: data.due_date_offset_days ?? null,
    created_at: now,
    updated_at: now,
  }
  const stmt = db.prepare(
    `INSERT INTO templates (id, name, description, category, title_template, priority, is_recurring, recurrence_pattern, reminder_minutes, subtasks_json, due_date_offset_days, created_at, updated_at)
      VALUES (@id, @name, @description, @category, @title_template, @priority, @is_recurring, @recurrence_pattern, @reminder_minutes, @subtasks_json, @due_date_offset_days, @created_at, @updated_at)`
  )
  stmt.run({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    title_template: template.title_template,
    priority: template.priority,
    is_recurring: template.is_recurring ? 1 : 0,
    recurrence_pattern: template.recurrence_pattern,
    reminder_minutes: template.reminder_minutes,
    subtasks_json: template.subtasks_json,
    due_date_offset_days: template.due_date_offset_days,
    created_at: template.created_at,
    updated_at: template.updated_at,
  })
  return template
}

export function updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'created_at'>>): Template | null {
  const existing = getTemplateById(id)
  if (!existing) return null
  const now = new Date().toISOString()
  const nextRecurring = updates.is_recurring ?? existing.is_recurring
  const updated: Template = {
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    description: updates.description !== undefined ? (updates.description?.trim() || null) : existing.description,
    category: updates.category !== undefined ? (updates.category?.trim() || null) : existing.category,
    title_template: updates.title_template !== undefined ? updates.title_template.trim() : existing.title_template,
    priority: normalizePriority(updates.priority ?? existing.priority),
    is_recurring: nextRecurring,
    recurrence_pattern: nextRecurring ? (updates.recurrence_pattern ?? existing.recurrence_pattern) : null,
    reminder_minutes: updates.reminder_minutes !== undefined ? updates.reminder_minutes : existing.reminder_minutes,
    subtasks_json: updates.subtasks_json !== undefined ? updates.subtasks_json : existing.subtasks_json,
    due_date_offset_days: updates.due_date_offset_days !== undefined ? updates.due_date_offset_days : existing.due_date_offset_days,
    updated_at: now,
  }
  const stmt = db.prepare(
    `UPDATE templates SET name = @name, description = @description, category = @category, title_template = @title_template,
      priority = @priority, is_recurring = @is_recurring, recurrence_pattern = @recurrence_pattern,
      reminder_minutes = @reminder_minutes, subtasks_json = @subtasks_json, due_date_offset_days = @due_date_offset_days,
      updated_at = @updated_at WHERE id = @id`
  )
  stmt.run({
    id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    title_template: updated.title_template,
    priority: updated.priority,
    is_recurring: updated.is_recurring ? 1 : 0,
    recurrence_pattern: updated.recurrence_pattern,
    reminder_minutes: updated.reminder_minutes,
    subtasks_json: updated.subtasks_json,
    due_date_offset_days: updated.due_date_offset_days,
    updated_at: updated.updated_at,
  })
  return updated
}

export function deleteTemplate(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM templates WHERE id = ?`)
  const result = stmt.run(id)
  return result.changes > 0
}

// --- Holidays ---

export interface Holiday {
  id: string
  date: string       // YYYY-MM-DD
  name: string
  observed: boolean
}

db.exec(`
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  observed INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS holidays_date_idx ON holidays(date);
`)

export function getAllHolidays(): Holiday[] {
  const stmt = db.prepare(`SELECT * FROM holidays ORDER BY date ASC`)
  const rows = stmt.all() as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    name: String(row.name),
    observed: Boolean(row.observed),
  }))
}

export function getHolidaysByMonth(year: number, month: number): Holiday[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const stmt = db.prepare(`SELECT * FROM holidays WHERE date LIKE ? ORDER BY date ASC`)
  const rows = stmt.all(`${prefix}%`) as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    name: String(row.name),
    observed: Boolean(row.observed),
  }))
}

export function seedHolidays(holidays: Array<{ date: string; name: string; observed?: boolean }>): number {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO holidays (id, date, name, observed) VALUES (@id, @date, @name, @observed)`
  )
  let count = 0
  const insertMany = db.transaction((items: typeof holidays) => {
    for (const h of items) {
      const result = insert.run({
        id: uuidv4(),
        date: h.date,
        name: h.name,
        observed: (h.observed ?? true) ? 1 : 0,
      })
      if (result.changes > 0) count++
    }
  })
  insertMany(holidays)
  return count
}

// --- Users ---

export function getUserById(id: string): User | null {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  return { id: String(row.id), username: String(row.username), created_at: String(row.created_at) }
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`)
  const row = stmt.get(username) as Record<string, unknown> | undefined
  if (!row) return null
  return { id: String(row.id), username: String(row.username), created_at: String(row.created_at) }
}

export function createUser(username: string): User {
  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)`).run(id, username, now)
  return { id, username, created_at: now }
}

// --- Authenticators ---

export function getAuthenticatorsByUserId(userId: string): Authenticator[] {
  const stmt = db.prepare(`SELECT * FROM authenticators WHERE user_id = ?`)
  const rows = stmt.all(userId) as Array<Record<string, unknown>>
  return rows.map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    credential_id: String(row.credential_id),
    credential_public_key: String(row.credential_public_key),
    counter: Number(row.counter ?? 0),
    transports: row.transports === null || row.transports === undefined ? null : String(row.transports),
    created_at: String(row.created_at),
  }))
}

export function getAuthenticatorByCredentialId(credentialId: string): (Authenticator & { username: string }) | null {
  const stmt = db.prepare(`
    SELECT a.*, u.username FROM authenticators a
    INNER JOIN users u ON u.id = a.user_id
    WHERE a.credential_id = ?
  `)
  const row = stmt.get(credentialId) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    credential_id: String(row.credential_id),
    credential_public_key: String(row.credential_public_key),
    counter: Number(row.counter ?? 0),
    transports: row.transports === null || row.transports === undefined ? null : String(row.transports),
    created_at: String(row.created_at),
    username: String(row.username),
  }
}

export function createAuthenticator(data: {
  user_id: string
  credential_id: string
  credential_public_key: string
  counter: number
  transports: string | null
}): Authenticator {
  const id = uuidv4()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO authenticators (id, user_id, credential_id, credential_public_key, counter, transports, created_at)
     VALUES (@id, @user_id, @credential_id, @credential_public_key, @counter, @transports, @created_at)`
  ).run({
    id,
    user_id: data.user_id,
    credential_id: data.credential_id,
    credential_public_key: data.credential_public_key,
    counter: data.counter ?? 0,
    transports: data.transports,
    created_at: now,
  })
  return {
    id,
    user_id: data.user_id,
    credential_id: data.credential_id,
    credential_public_key: data.credential_public_key,
    counter: data.counter ?? 0,
    transports: data.transports,
    created_at: now,
  }
}

export function updateAuthenticatorCounter(credentialId: string, counter: number): void {
  db.prepare(`UPDATE authenticators SET counter = ? WHERE credential_id = ?`).run(counter, credentialId)
}

// In-memory challenge store (keyed by username, short-lived)
const challengeStore = new Map<string, string>()

export function setChallenge(key: string, challenge: string): void {
  challengeStore.set(key, challenge)
}

export function getChallenge(key: string): string | null {
  return challengeStore.get(key) ?? null
}

export function deleteChallenge(key: string): void {
  challengeStore.delete(key)
}
