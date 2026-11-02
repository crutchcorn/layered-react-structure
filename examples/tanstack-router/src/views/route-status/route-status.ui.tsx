import { StatusMessage } from '../../components/status-message'

export function RouteErrorUI({ onRetry }: { onRetry: () => void }) {
  return (
    <StatusMessage
      title="Something went wrong"
      description="We couldn't open this page. Please try again."
      action={<button onClick={onRetry}>Try again</button>}
    />
  )
}
