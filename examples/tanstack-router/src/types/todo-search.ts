import type * as v from 'valibot'
import type { TodoSearchSchema } from '../utils/todo-search'

export type TodoSearch = v.InferOutput<typeof TodoSearchSchema>

export type TodoFilter = 'all' | NonNullable<TodoSearch['status']>
