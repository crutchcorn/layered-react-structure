import * as v from 'valibot'
import { TodoInputSchema } from './todo-schema'
import type { Todo, TodoInput, TodoInputErrors } from '../types/todo'

export function getTodoInputErrors(input: TodoInput): TodoInputErrors {
  const result = v.safeParse(TodoInputSchema, input)
  if (result.success) return {}

  const errors = v.flatten<typeof TodoInputSchema>(result.issues)
  return Object.fromEntries(
    Object.entries(errors.nested ?? {}).map(([field, messages]) => [
      field,
      messages[0],
    ]),
  )
}

export function validateTodoInput(input: TodoInput): TodoInput {
  return v.parse(TodoInputSchema, input)
}

export function toggleTodoInList(
  todos: Todo[],
  id: string,
  updatedAt: string,
): Todo[] {
  if (!todos.some((todo) => todo.id === id)) {
    throw new Error('This task no longer exists.')
  }

  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed, updatedAt } : todo,
  )
}

export function deleteTodoFromList(todos: Todo[], id: string): Todo[] {
  return todos.filter((todo) => todo.id !== id)
}
