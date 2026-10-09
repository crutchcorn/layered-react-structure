import type * as v from 'valibot'
import type {
  TodoInputSchema,
  TodoPrioritySchema,
  TodoSchema,
} from '../utils/todo-schema'

export type TodoPriority = v.InferOutput<typeof TodoPrioritySchema>

export type Todo = v.InferOutput<typeof TodoSchema>

export type TodoInput = v.InferOutput<typeof TodoInputSchema>

export interface StorageStatus {
  kind: 'available' | 'unavailable' | 'quota-exceeded' | 'invalid-data'
  message: string | null
}
