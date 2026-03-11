module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/lib/priority.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "comparePriorityDesc",
    ()=>comparePriorityDesc,
    "filterTodosByPriority",
    ()=>filterTodosByPriority,
    "normalizePriority",
    ()=>normalizePriority,
    "sortTodosByPriority",
    ()=>sortTodosByPriority
]);
const priorityOrder = {
    high: 3,
    medium: 2,
    low: 1
};
function normalizePriority(value) {
    if (value === 'high' || value === 'medium' || value === 'low') {
        return value;
    }
    return 'medium';
}
function comparePriorityDesc(a, b) {
    return priorityOrder[b] - priorityOrder[a];
}
function sortTodosByPriority(todos) {
    return [
        ...todos
    ].sort((a, b)=>{
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const priorityDiff = comparePriorityDesc(a.priority, b.priority);
        if (priorityDiff !== 0) return priorityDiff;
        const da = a.due_date ? Date.parse(a.due_date) : Number.POSITIVE_INFINITY;
        const db = b.due_date ? Date.parse(b.due_date) : Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
        return Date.parse(a.created_at) - Date.parse(b.created_at);
    });
}
function filterTodosByPriority(todos, selectedPriority) {
    if (selectedPriority === 'all') {
        return todos;
    }
    return todos.filter((todo)=>todo.priority === selectedPriority);
}
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addTagToTodo",
    ()=>addTagToTodo,
    "createSubtask",
    ()=>createSubtask,
    "createTag",
    ()=>createTag,
    "createTodo",
    ()=>createTodo,
    "deleteTodo",
    ()=>deleteTodo,
    "exportAllData",
    ()=>exportAllData,
    "getAllSubtasks",
    ()=>getAllSubtasks,
    "getAllTags",
    ()=>getAllTags,
    "getAllTodoTags",
    ()=>getAllTodoTags,
    "getAllTodos",
    ()=>getAllTodos,
    "getSubtasksByTodoId",
    ()=>getSubtasksByTodoId,
    "getTagById",
    ()=>getTagById,
    "getTagByName",
    ()=>getTagByName,
    "getTodoById",
    ()=>getTodoById,
    "importBackup",
    ()=>importBackup,
    "updateTodo",
    ()=>updateTodo
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$better$2d$sqlite3$29$__ = __turbopack_context__.i("[externals]/better-sqlite3 [external] (better-sqlite3, cjs, [project]/node_modules/better-sqlite3)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-route] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$priority$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/priority.ts [app-route] (ecmascript)");
;
;
;
const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$better$2d$sqlite3$29$__["default"]('todos.db');
db.pragma('foreign_keys = ON');
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
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON todos(due_date);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON todos(completed);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
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
`);
// Migration for existing databases that predate recurring fields.
try {
    db.exec(`ALTER TABLE todos ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;`);
} catch  {
// Column already exists.
}
try {
    db.exec(`ALTER TABLE todos ADD COLUMN recurrence_pattern TEXT NULL;`);
} catch  {
// Column already exists.
}
function getAllTodos() {
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
  `);
    const rows = stmt.all();
    return rows.map((row)=>({
            id: String(row.id),
            title: String(row.title),
            due_date: row.due_date === null ? null : String(row.due_date),
            priority: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$priority$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizePriority"])(row.priority),
            is_recurring: Boolean(row.is_recurring),
            recurrence_pattern: row.recurrence_pattern === null ? null : String(row.recurrence_pattern),
            completed: Boolean(row.completed),
            created_at: String(row.created_at),
            updated_at: String(row.updated_at)
        }));
}
function getTodoById(id) {
    const stmt = db.prepare(`SELECT * FROM todos WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
        id: String(row.id),
        title: String(row.title),
        due_date: row.due_date === null ? null : String(row.due_date),
        priority: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$priority$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizePriority"])(row.priority),
        is_recurring: Boolean(row.is_recurring),
        recurrence_pattern: row.recurrence_pattern === null ? null : String(row.recurrence_pattern),
        completed: Boolean(row.completed),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at)
    };
}
function createTodo(data) {
    const now = new Date().toISOString();
    const isRecurring = Boolean(data.is_recurring);
    const recurrencePattern = isRecurring ? data.recurrence_pattern ?? null : null;
    const todo = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        title: data.title.trim(),
        due_date: data.due_date,
        priority: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$priority$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizePriority"])(data.priority),
        is_recurring: isRecurring,
        recurrence_pattern: recurrencePattern,
        completed: false,
        created_at: now,
        updated_at: now
    };
    const stmt = db.prepare(`INSERT INTO todos (id, title, due_date, priority, is_recurring, recurrence_pattern, completed, created_at, updated_at)
      VALUES (@id, @title, @due_date, @priority, @is_recurring, @recurrence_pattern, @completed, @created_at, @updated_at)`);
    stmt.run({
        id: todo.id,
        title: todo.title,
        due_date: todo.due_date,
        priority: todo.priority,
        is_recurring: todo.is_recurring ? 1 : 0,
        recurrence_pattern: todo.recurrence_pattern,
        completed: 0,
        created_at: todo.created_at,
        updated_at: todo.updated_at
    });
    return todo;
}
function updateTodo(id, updates) {
    const existing = getTodoById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const nextRecurringValue = updates.is_recurring ?? existing.is_recurring;
    const nextPatternValue = nextRecurringValue ? updates.recurrence_pattern ?? existing.recurrence_pattern : null;
    const updated = {
        ...existing,
        ...updates,
        priority: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$priority$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizePriority"])(updates.priority ?? existing.priority),
        is_recurring: nextRecurringValue,
        recurrence_pattern: nextPatternValue,
        updated_at: now
    };
    const stmt = db.prepare(`UPDATE todos
      SET title = @title,
          due_date = @due_date,
          priority = @priority,
          is_recurring = @is_recurring,
          recurrence_pattern = @recurrence_pattern,
          completed = @completed,
          updated_at = @updated_at
      WHERE id = @id`);
    stmt.run({
        id,
        title: updated.title,
        due_date: updated.due_date,
        priority: updated.priority,
        is_recurring: updated.is_recurring ? 1 : 0,
        recurrence_pattern: updated.recurrence_pattern,
        completed: updated.completed ? 1 : 0,
        updated_at: updated.updated_at
    });
    return updated;
}
function deleteTodo(id) {
    const stmt = db.prepare(`DELETE FROM todos WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
}
function getAllTags() {
    const stmt = db.prepare(`SELECT * FROM tags ORDER BY name ASC`);
    const rows = stmt.all();
    return rows.map((row)=>({
            id: String(row.id),
            name: String(row.name),
            created_at: String(row.created_at),
            updated_at: String(row.updated_at)
        }));
}
function getTagById(id) {
    const stmt = db.prepare(`SELECT * FROM tags WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
        id: String(row.id),
        name: String(row.name),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at)
    };
}
function getTagByName(name) {
    const stmt = db.prepare(`SELECT * FROM tags WHERE LOWER(name) = LOWER(?)`);
    const row = stmt.get(name);
    if (!row) return null;
    return {
        id: String(row.id),
        name: String(row.name),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at)
    };
}
function createTag(data) {
    const now = new Date().toISOString();
    const tag = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        name: data.name.trim(),
        created_at: data.created_at ?? now,
        updated_at: data.updated_at ?? now
    };
    const stmt = db.prepare(`INSERT INTO tags (id, name, created_at, updated_at) VALUES (@id, @name, @created_at, @updated_at)`);
    stmt.run({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at,
        updated_at: tag.updated_at
    });
    return tag;
}
function getAllTodoTags() {
    const stmt = db.prepare(`SELECT * FROM todo_tags`);
    const rows = stmt.all();
    return rows.map((row)=>({
            todo_id: String(row.todo_id),
            tag_id: String(row.tag_id)
        }));
}
function addTagToTodo(todoId, tagId) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)`);
    stmt.run(todoId, tagId);
}
function getSubtasksByTodoId(todoId) {
    const stmt = db.prepare(`SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC`);
    const rows = stmt.all(todoId);
    return rows.map((row)=>({
            id: String(row.id),
            todo_id: String(row.todo_id),
            title: String(row.title),
            completed: Boolean(row.completed),
            position: Number(row.position),
            created_at: String(row.created_at),
            updated_at: String(row.updated_at)
        }));
}
function createSubtask(data) {
    const now = new Date().toISOString();
    const subtask = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
        todo_id: data.todo_id,
        title: data.title.trim(),
        completed: Boolean(data.completed),
        position: data.position ?? 0,
        created_at: data.created_at ?? now,
        updated_at: data.updated_at ?? now
    };
    const stmt = db.prepare(`INSERT INTO subtasks (id, todo_id, title, completed, position, created_at, updated_at)
      VALUES (@id, @todo_id, @title, @completed, @position, @created_at, @updated_at)`);
    stmt.run({
        id: subtask.id,
        todo_id: subtask.todo_id,
        title: subtask.title,
        completed: subtask.completed ? 1 : 0,
        position: subtask.position,
        created_at: subtask.created_at,
        updated_at: subtask.updated_at
    });
    return subtask;
}
function getAllSubtasks() {
    const stmt = db.prepare(`SELECT * FROM subtasks ORDER BY todo_id ASC, position ASC`);
    const rows = stmt.all();
    return rows.map((row)=>({
            id: String(row.id),
            todo_id: String(row.todo_id),
            title: String(row.title),
            completed: Boolean(row.completed),
            position: Number(row.position),
            created_at: String(row.created_at),
            updated_at: String(row.updated_at)
        }));
}
function exportAllData() {
    return {
        version: 1,
        exported_at: new Date().toISOString(),
        todos: getAllTodos(),
        tags: getAllTags(),
        todo_tags: getAllTodoTags(),
        subtasks: getAllSubtasks()
    };
}
function importBackup(data) {
    if (data.version !== 1) {
        throw new Error('Unsupported export version');
    }
    const now = new Date().toISOString();
    const todoIdMap = new Map();
    const tagIdMap = new Map();
    (data.tags ?? []).forEach((tag)=>{
        const name = tag.name?.trim() ?? '';
        if (!name) return;
        const existing = getTagByName(name);
        if (existing) {
            tagIdMap.set(tag.id, existing.id);
            return;
        }
        const created = createTag({
            name,
            created_at: tag.created_at ?? now,
            updated_at: tag.updated_at ?? now
        });
        tagIdMap.set(tag.id, created.id);
    });
    (data.todos ?? []).forEach((todo)=>{
        const created = createTodo({
            title: todo.title ?? 'Untitled',
            due_date: todo.due_date ?? null,
            priority: todo.priority ?? 'medium',
            is_recurring: todo.is_recurring ?? false,
            recurrence_pattern: todo.recurrence_pattern ?? null
        });
        // Update timestamps if provided
        if (todo.created_at || todo.updated_at) {
            const stmt = db.prepare(`UPDATE todos SET created_at = @created_at, updated_at = @updated_at WHERE id = @id`);
            stmt.run({
                id: created.id,
                created_at: todo.created_at ?? created.created_at,
                updated_at: todo.updated_at ?? created.updated_at
            });
        }
        todoIdMap.set(todo.id, created.id);
    });
    (data.subtasks ?? []).forEach((subtask)=>{
        const mappedTodoId = todoIdMap.get(subtask.todo_id);
        if (!mappedTodoId) return;
        const created = createSubtask({
            todo_id: mappedTodoId,
            title: subtask.title ?? 'Subtask',
            completed: subtask.completed ?? false,
            position: subtask.position ?? 0,
            created_at: subtask.created_at ?? now,
            updated_at: subtask.updated_at ?? now
        });
    // No further mapping needed for subtasks currently
    });
    (data.todo_tags ?? []).forEach((assoc)=>{
        const mappedTodoId = todoIdMap.get(assoc.todo_id);
        const mappedTagId = tagIdMap.get(assoc.tag_id);
        if (!mappedTodoId || !mappedTagId) return;
        addTagToTodo(mappedTodoId, mappedTagId);
    });
    return {
        imported: {
            todos: todoIdMap.size,
            tags: tagIdMap.size,
            subtasks: (data.subtasks ?? []).length,
            associations: (data.todo_tags ?? []).length
        }
    };
}
}),
"[project]/app/api/todos/import/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
;
;
;
const importSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().positive(),
    todos: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        due_date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
        priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        is_recurring: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        recurrence_pattern: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
        completed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        created_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        updated_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).optional(),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        created_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        updated_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).optional(),
    todo_tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        todo_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        tag_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).optional(),
    subtasks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        todo_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        completed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
        created_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        updated_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).optional()
});
async function POST(request) {
    const body = await request.json().catch(()=>null);
    if (!body) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Invalid JSON'
        }, {
            status: 400
        });
    }
    const parseResult = importSchema.safeParse(body);
    if (!parseResult.success) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: parseResult.error.flatten().formErrors.join('; ')
        }, {
            status: 400
        });
    }
    try {
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["importBackup"])(parseResult.data);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message
        }, {
            status: 400
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4adf8db4._.js.map