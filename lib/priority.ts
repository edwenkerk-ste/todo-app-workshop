import type { Priority } from './db'

export type PriorityFilter = Priority | 'all'

const priorityOrder: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export function normalizePriority(value: unknown): Priority {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }
  return 'medium'
}

export function comparePriorityDesc(a: Priority, b: Priority): number {
  return priorityOrder[b] - priorityOrder[a]
}

export function sortTodosByPriority<T extends {
  completed: boolean
  priority: Priority
  due_date: string | null
  created_at: string
}>(todos: T[]): T[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    const priorityDiff = comparePriorityDesc(a.priority, b.priority)
    if (priorityDiff !== 0) return priorityDiff

    const da = a.due_date ? Date.parse(a.due_date) : Number.POSITIVE_INFINITY
    const db = b.due_date ? Date.parse(b.due_date) : Number.POSITIVE_INFINITY
    if (da !== db) return da - db

    return Date.parse(a.created_at) - Date.parse(b.created_at)
  })
}

export function filterTodosByPriority<T extends { priority: Priority }>(
  todos: T[],
  selectedPriority: PriorityFilter
): T[] {
  if (selectedPriority === 'all') {
    return todos
  }
  return todos.filter((todo) => todo.priority === selectedPriority)
}
