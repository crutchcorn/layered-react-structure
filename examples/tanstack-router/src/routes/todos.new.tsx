import { createFileRoute } from '@tanstack/react-router'
import { TodoCreateView } from '../views/todo-create/todo-create.view'

export const Route = createFileRoute('/todos/new')({
  component: TodoCreateView,
})
