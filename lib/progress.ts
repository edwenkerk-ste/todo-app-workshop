export interface SubtaskProgress {
  total: number
  completed: number
  percent: number
  label: string
}

export function calculateProgress(subtasks: { completed: boolean }[]): SubtaskProgress {
  const total = subtasks.length
  const completed = subtasks.filter((s) => s.completed).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const label = total === 0 ? 'No subtasks' : `${completed}/${total} completed (${percent}%)`
  return { total, completed, percent, label }
}
