import type { ReactFormType } from '@tanstack/react-form'
import type { todoFormOptions } from '../utils/todo-form-options'

export type TodoForm = ReactFormType<typeof todoFormOptions>
