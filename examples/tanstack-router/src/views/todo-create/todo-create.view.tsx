import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTodoActions } from '../../hooks/use-todos'
import { usePageTitle } from '../../hooks/use-page-title'
import { TodoCreateUI } from './todo-create.ui'
import { todoFormOptions } from './utils/todo-form-options'

export function TodoCreateView() {
  usePageTitle('New task')
  const navigate = useNavigate()
  const actions = useTodoActions()
  const form = useForm({
    ...todoFormOptions,
    onSubmit: async ({ schemaOutputs, createValidationError }) => {
      try {
        const todo = await actions.createTodo(schemaOutputs[0])
        await navigate({ to: '/todos/$todoId', params: { todoId: todo.id } })
      } catch (error) {
        return createValidationError(
          error instanceof Error
            ? error.message
            : 'Could not create this task.',
        )
      }
    },
  })

  function submit() {
    if (!actions.isPending) void form.handleSubmit()
  }

  return (
    <TodoCreateUI
      form={form}
      isPending={actions.isPending}
      onSubmit={submit}
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
    />
  )
}
