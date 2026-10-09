import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTodoActions } from '../../hooks/use-todos'
import { usePageTitle } from '../../hooks/use-page-title'
import { getTodoInputErrors } from '../../utils/todos'
import { TodoCreateUI } from './todo-create.ui'
import type { TodoInput, TodoInputErrors } from '../../types/todo'

export function TodoCreateView() {
  usePageTitle('New task')
  const navigate = useNavigate()
  const actions = useTodoActions()
  const [values, setValues] = useState<TodoInput>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: null,
  })
  const [fieldErrors, setFieldErrors] = useState<TodoInputErrors>({})

  async function submit() {
    if (actions.isPending) return
    const errors = getTodoInputErrors(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    try {
      const todo = await actions.createTodo(values)
      await navigate({ to: '/todos/$todoId', params: { todoId: todo.id } })
    } catch {
      // Keep the draft in place and display the mutation error.
    }
  }

  return (
    <TodoCreateUI
      values={values}
      onChange={(patch) => {
        setValues((current) => ({ ...current, ...patch }))
        setFieldErrors({})
      }}
      onSubmit={() => {
        void submit()
      }}
      cancelLink={
        <Link to="/" search={{}}>
          Cancel
        </Link>
      }
      backLink={
        <Link to="/" search={{}}>
          All tasks
        </Link>
      }
      isSaving={actions.isPending}
      error={actions.error?.message}
      fieldErrors={fieldErrors}
    />
  )
}
