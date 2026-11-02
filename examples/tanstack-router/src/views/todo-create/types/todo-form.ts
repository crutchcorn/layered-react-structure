import type { ReactFormType } from '@tanstack/react-form'
import type { todoFormOptions } from '../todo-create.logic'

export type TodoForm = ReactFormType<typeof todoFormOptions>
