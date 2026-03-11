import { z } from 'zod'
import { isFutureSingaporeIso } from './timezone'

export const prioritySchema = z.enum(['high', 'medium', 'low'])

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }),
  due_date: z
    .string()
    .optional()
    .refine((val) => (val ? isFutureSingaporeIso(val) : true), {
      message: 'Due date must be at least 1 minute in the future (Singapore time)',
    }),
  priority: prioritySchema.optional(),
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
})
