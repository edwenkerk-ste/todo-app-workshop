import { z } from 'zod'
import { isFutureSingaporeIso } from './timezone'

export const prioritySchema = z.enum(['high', 'medium', 'low'])
export const recurrencePatternSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly'])

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }),
  due_date: z
    .string()
    .optional()
    .refine((val) => (val ? isFutureSingaporeIso(val) : true), {
      message: 'Due date must be at least 1 minute in the future (Singapore time)',
    }),
  priority: prioritySchema.optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: recurrencePatternSchema.nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (!data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Recurring todos require a due date',
      })
    }
    if (!data.recurrence_pattern) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence_pattern'],
        message: 'Recurring todos require a recurrence pattern',
      })
    }
  }
})

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  due_date: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (val === null || val === undefined || val === '') return true
      return isFutureSingaporeIso(val)
    }, {
      message: 'Due date must be at least 1 minute in the future (Singapore time)',
    }),
  priority: prioritySchema.optional(),
  completed: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: recurrencePatternSchema.nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (!data.recurrence_pattern) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence_pattern'],
        message: 'Recurring todos require a recurrence pattern',
      })
    }
    if (data.due_date === null || data.due_date === undefined || data.due_date === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Recurring todos require a due date',
      })
    }
  }
})
