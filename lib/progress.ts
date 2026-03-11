export interface SubtaskProgress {
  total: number
  completed: number
  percent: number
}

export function calculateProgress(subtasks: { completed: boolean }[]): SubtaskProgress {
  const total = subtasks.length
  if (total === 0) {
    return { total: 0, completed: 0, percent: 0 }
  }
  const completed = subtasks.filter((s) => s.completed).length
  const percent = Math.round((completed / total) * 100)
  return { total, completed, percent }
}
