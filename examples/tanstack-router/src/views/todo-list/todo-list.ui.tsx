import type { ReactNode } from 'react'
import type { Todo } from '../../types/todo'
import { Icon } from '../../components/icon'
import { DueDate, PriorityBadge } from '../../components/todo-meta'
import {
  ErrorNotice,
  LoadingTasks,
  StatusMessage,
} from '../../components/status-message'
import shared from '../../styles.module.css'
import styles from './todo-list.module.css'

type TodoFilter = 'all' | 'open' | 'done'

interface TodoListUIProps {
  todos: Todo[]
  totalCount: number
  completedCount: number
  search: string
  filter: TodoFilter
  onSearchChange: (search: string) => void
  onFilterChange: (filter: TodoFilter) => void
  onToggle: (todo: Todo) => void
  createLink: ReactNode
  renderTodoLink: (todo: Todo, children: ReactNode) => ReactNode
  isLoading?: boolean
  isSaving?: boolean
  error?: string | null
  onRetry?: () => void
  mutationError?: string | null
}

export function TodoListUI({
  todos,
  totalCount,
  completedCount,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onToggle,
  createLink,
  renderTodoLink,
  isLoading,
  isSaving,
  error,
  onRetry,
  mutationError,
}: TodoListUIProps) {
  const filters: { value: TodoFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All tasks', count: totalCount },
    { value: 'open', label: 'To do', count: totalCount - completedCount },
    { value: 'done', label: 'Completed', count: completedCount },
  ]

  return (
    <>
      <div className={shared['page-heading']}>
        <div>
          <p className={shared['eyebrow']}>ONE THING AT A TIME</p>
          <h1 className={shared['page-title']}>
            Your tasks<span className={shared['heading-period']}>.</span>
          </h1>
          <p className={shared['page-description']}>
            Make room for what matters. Start with a small step.
          </p>
        </div>
        <div
          className={`${shared['button-slot']} ${shared['primary-button-slot']}`}
        >
          <Icon name="plus" size={18} />
          {createLink}
        </div>
      </div>
      <section className={styles['task-summary']} aria-label="Task summary">
        <div className={styles['summary-item']}>
          <span className={styles['summary-label']}>Total tasks</span>
          <span className={styles['summary-number']}>
            {isLoading ? '—' : totalCount.toString().padStart(2, '0')}
          </span>
          <span className={styles['summary-detail']}>
            A little clarity for your day
          </span>
        </div>
        <div className={styles['summary-item']}>
          <span className={styles['summary-label']}>
            <span
              className={`${styles['summary-dot']} ${styles['open-dot']}`}
            />
            To do
          </span>
          <span className={styles['summary-number']}>
            {isLoading
              ? '—'
              : (totalCount - completedCount).toString().padStart(2, '0')}
          </span>
          <span className={styles['summary-detail']}>Ready when you are</span>
        </div>
        <div className={styles['summary-item']}>
          <span className={styles['summary-label']}>
            <span
              className={`${styles['summary-dot']} ${styles['completed-dot']}`}
            />
            Completed
          </span>
          <span
            className={`${styles['summary-number']} ${styles['completed-number']}`}
          >
            {isLoading ? '—' : completedCount.toString().padStart(2, '0')}
          </span>
          <span className={styles['summary-detail']}>
            Every small win counts
          </span>
        </div>
      </section>
      <div className={styles['tasks-section-heading']}>
        <h2>A little progress, every day</h2>
        <span>
          {totalCount === 0 ? 'YOUR FRESH START' : 'YOUR RUNNING LIST'}
        </span>
      </div>
      <div className={styles['task-toolbar']}>
        <div
          className={styles['filter-group']}
          role="group"
          aria-label="Filter tasks"
        >
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? `${styles['filter-button']} ${styles['is-active']}`
                  : styles['filter-button']
              }
              aria-label={`${label} ${count}`}
              aria-pressed={filter === value}
              onClick={() => onFilterChange(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <label className={styles['search-field']}>
          <Icon name="search" size={17} />
          <span className={shared['sr-only']}>Search tasks</span>
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
      {mutationError && <ErrorNotice message={mutationError} />}
      {isLoading ? (
        <LoadingTasks />
      ) : error ? (
        <ErrorNotice message={error} onRetry={onRetry} />
      ) : todos.length === 0 ? (
        <StatusMessage
          title={
            totalCount === 0
              ? 'A fresh start, just for you.'
              : search
                ? 'No tasks found.'
                : filter === 'done'
                  ? 'Small wins are on their way.'
                  : 'All clear. Take a breath.'
          }
          description={
            totalCount === 0
              ? 'Add your first task and give that good idea a place to land.'
              : search
                ? 'Try another word or clear your search to see more tasks.'
                : filter === 'done'
                  ? 'Your completed tasks will appear here. One step at a time.'
                  : 'You’ve finished everything on this list. Enjoy a little space.'
          }
          action={
            totalCount === 0 ? (
              createLink
            ) : search ? (
              <button type="button" onClick={() => onSearchChange('')}>
                Clear search
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles['task-list']} aria-label="Tasks">
          {todos.map((todo) => (
            <li
              className={
                todo.completed
                  ? `${styles['task-card']} ${styles['is-completed']}`
                  : styles['task-card']
              }
              key={todo.id}
            >
              <label className={styles['task-checkbox']}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={isSaving}
                  onChange={() => onToggle(todo)}
                  aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
                />
                <span>
                  <Icon name="check" size={14} />
                </span>
              </label>
              <div className={styles['task-card-main']}>
                <h3>{renderTodoLink(todo, todo.title)}</h3>
                {todo.description && (
                  <p className={styles['task-description']}>
                    {todo.description}
                  </p>
                )}
                <div className={styles['task-card-meta']}>
                  <PriorityBadge priority={todo.priority} />
                  {todo.dueDate && <DueDate date={todo.dueDate} />}
                  {todo.completed && (
                    <span className={styles['completed-label']}>Completed</span>
                  )}
                </div>
              </div>
              <span className={styles['task-card-arrow']} aria-hidden="true">
                ↗
              </span>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !error && totalCount > 0 && (
        <p className={styles['list-footnote']}>
          <Icon name="check" size={13} />
          Check off a task to celebrate a little progress.
        </p>
      )}
    </>
  )
}
