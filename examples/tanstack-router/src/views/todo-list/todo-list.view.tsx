import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useTodoActions, useTodos } from '../../hooks/use-todos'
import { usePageTitle } from '../../hooks/use-page-title'
import { TodoListUI } from './todo-list.ui'

export function TodoListView() {
  usePageTitle('Your tasks')
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const query = useTodos()
  const actions = useTodoActions()
  const todos = query.data ?? []
  const filter = search.status ?? 'all'
  const term = (search.q ?? '').trim().toLocaleLowerCase()
  const visibleTodos = todos.filter((todo) => {
    const matchesStatus =
      filter === 'all' || todo.completed === (filter === 'done')
    return (
      matchesStatus &&
      `${todo.title} ${todo.description}`.toLocaleLowerCase().includes(term)
    )
  })

  return (
    <TodoListUI
      todos={visibleTodos}
      totalCount={todos.length}
      completedCount={todos.filter((todo) => todo.completed).length}
      search={search.q ?? ''}
      filter={filter}
      onSearchChange={(q) => {
        void navigate({
          search: { ...search, q: q || undefined },
          replace: true,
        })
      }}
      onFilterChange={(status) => {
        void navigate({
          search: { ...search, status: status === 'all' ? undefined : status },
        })
      }}
      onToggle={(todo) => {
        void actions.toggleTodo(todo.id).catch(() => {})
      }}
      createLink={<Link to="/todos/new">New task</Link>}
      renderTodoLink={(todo, children) => (
        <Link to="/todos/$todoId" params={{ todoId: todo.id }}>
          {children}
        </Link>
      )}
      isLoading={query.isPending || query.isRestoring}
      isSaving={actions.isPending}
      error={query.error?.message}
      mutationError={actions.error?.message}
      onRetry={() => {
        void query.refetch()
      }}
    />
  )
}
