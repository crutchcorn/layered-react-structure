import { createFileRoute } from '@tanstack/react-router'
import { TodoDetailView } from '../views/todo-detail/todo-detail.view'

export const Route = createFileRoute('/todos/$todoId')({
  component: TodoDetailView,
})
