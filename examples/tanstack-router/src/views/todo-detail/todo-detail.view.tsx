import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useTodoActions, useTodos } from '../../hooks/use-todos'
import { usePageTitle } from '../../hooks/use-page-title'
import { TodoDetailUI } from './todo-detail.ui'

export function TodoDetailView() {
  const { todoId } = useParams({ from: '/todos/$todoId' })
  const navigate = useNavigate()
  const query = useTodos()
  const actions = useTodoActions()
  const todo = query.data?.find((item) => item.id === todoId)
  usePageTitle(todo?.title ?? 'Task details')

  async function deleteTodo() {
    try {
      await actions.deleteTodo(todoId)
      await navigate({ to: '/', search: {} })
    } catch {
      // The mutation's error is rendered below, keeping the task visible.
    }
  }

  return (
    <TodoDetailUI
      todo={todo}
      backLink={
        <Link to="/" search={{}}>
          All tasks
        </Link>
      }
      isLoading={query.isPending || query.isRestoring}
      error={query.error?.message}
      onRetry={() => {
        void query.refetch()
      }}
      onToggle={() => {
        void actions.toggleTodo(todoId).catch(() => {})
      }}
      onDelete={() => {
        void deleteTodo()
      }}
      isSaving={actions.isPending}
      isDeleting={actions.isPending}
      mutationError={actions.error?.message}
    />
  )
}
