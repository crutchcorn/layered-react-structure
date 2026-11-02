import { Link } from '@tanstack/react-router'
import { StatusMessage } from '../../components/status-message'
import { RouteErrorUI } from './route-status.ui'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <StatusMessage
      title="This page wandered off"
      description="The page you're looking for doesn't exist. Your tasks are right where you left them."
      action={
        <Link to="/" search={{}}>
          Back to all tasks
        </Link>
      }
    />
  )
}

export function RouteErrorView({ reset }: ErrorComponentProps) {
  return <RouteErrorUI onRetry={reset} />
}
