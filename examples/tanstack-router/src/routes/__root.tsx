import { createRootRoute } from '@tanstack/react-router'
import { ShellView } from '../views/shell/shell.view'
import {
  NotFoundView,
  RouteErrorView,
} from '../views/route-status/route-status.view'

export const Route = createRootRoute({
  component: ShellView,
  notFoundComponent: NotFoundView,
  errorComponent: RouteErrorView,
})
