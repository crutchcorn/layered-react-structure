import { createFileRoute } from '@tanstack/react-router'
import { TodoListView } from '../views/todo-list/todo-list.view'
import { parseTodoSearch } from '../utils/todo-search'

export const Route = createFileRoute('/')({
  validateSearch: parseTodoSearch,
  component: TodoListView,
})
