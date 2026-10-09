import type { ReactNode } from 'react'
import { Icon } from './icon'
import shared from '../styles.module.css'

export function StatusMessage({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <section className={shared['status-message']}>
      <span className={shared['status-symbol']}>
        <Icon name="leaf" size={30} />
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className={shared['button-slot']}>{action}</div>}
    </section>
  )
}

export function LoadingTasks() {
  return (
    <div
      className={shared['loading-tasks']}
      role="status"
      aria-label="Loading your tasks"
    >
      <span className={shared['sr-only']}>Loading your tasks…</span>
      {[0, 1, 2].map((item) => (
        <div className={shared['task-skeleton']} key={item}>
          <span />
          <div>
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className={shared['error-notice']} role="alert">
      <p>{message}</p>
      {onRetry && (
        <button
          className={shared['text-button']}
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  )
}
