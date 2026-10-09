import { Link } from '@tanstack/react-router'
import { StatusMessage } from '../../components/status-message'
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
  return (
    <StatusMessage
      title="Something went wrong"
      description="We couldn't open this page. Please try again."
      action={<button onClick={reset}>Try again</button>}
    />
  )
}
