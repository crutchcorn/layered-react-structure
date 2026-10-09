import type { Todo } from '../types/todo'
import { Icon } from './icon'
import shared from '../styles.module.css'

export function PriorityBadge({ priority }: { priority: Todo['priority'] }) {
  return (
    <span
      className={`${shared['priority-badge']} ${shared[`priority-${priority}`]}`}
    >
      <span />
      {priority === 'high'
        ? 'High'
        : priority === 'medium'
          ? 'Medium'
          : 'Low'}{' '}
      priority
    </span>
  )
}

export function DueDate({ date }: { date: string }) {
  const formatted = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
  return (
    <span className={shared['due-date']}>
      <Icon name="calendar" size={14} />
      <time dateTime={date}>{formatted}</time>
    </span>
  )
}
