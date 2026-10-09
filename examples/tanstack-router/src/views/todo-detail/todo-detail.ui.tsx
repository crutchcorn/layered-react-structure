import { useState } from 'react'
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
import styles from './todo-detail.module.css'

interface TodoDetailUIProps {
  todo?: Todo
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  backLink: ReactNode
  onToggle: () => void
  onDelete: () => void
  isSaving?: boolean
  isDeleting?: boolean
  mutationError?: string | null
}

export function TodoDetailUI({
  todo,
  isLoading,
  error,
  onRetry,
  backLink,
  onToggle,
  onDelete,
  isSaving,
  isDeleting,
  mutationError,
}: TodoDetailUIProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className={styles['detail-page']}>
      <div className={styles['back-link']}>
        <Icon name="arrow" size={16} />
        {backLink}
      </div>
      {isLoading ? (
        <LoadingTasks />
      ) : error ? (
        <ErrorNotice message={error} onRetry={onRetry} />
      ) : !todo ? (
        <StatusMessage
          title="This task has moved on."
          description="It may have been deleted, or the link may be incomplete. Your other tasks are right where you left them."
          action={backLink}
        />
      ) : (
        <>
          <div className={styles['detail-heading']}>
            <p className={`${shared['eyebrow']} ${styles['detail-eyebrow']}`}>
              A LITTLE FOCUS GOES A LONG WAY
            </p>
            <div
              className={
                todo.completed
                  ? `${styles['detail-status']} ${styles['is-done']}`
                  : styles['detail-status']
              }
            >
              <span />
              {todo.completed ? 'Completed' : 'To do'}
            </div>
            <h1
              className={
                todo.completed
                  ? `${shared['page-title']} ${styles['completed-title']}`
                  : shared['page-title']
              }
            >
              {todo.title}
            </h1>
            <p className={shared['page-description']}>
              One task. One next step. You’ve got this.
            </p>
          </div>
          <section className={styles['detail-card']} aria-label="Task details">
            <div className={styles['detail-properties']}>
              <div>
                <span className={styles['detail-property-label']}>
                  PRIORITY
                </span>
                <PriorityBadge priority={todo.priority} />
              </div>
              <div>
                <span className={styles['detail-property-label']}>
                  DUE DATE
                </span>
                {todo.dueDate ? (
                  <DueDate date={todo.dueDate} />
                ) : (
                  <span className={styles['no-due-date']}>
                    A little breathing room
                  </span>
                )}
              </div>
            </div>
            <div className={styles['detail-notes']}>
              <h2>Notes</h2>
              {todo.description ? (
                <p>{todo.description}</p>
              ) : (
                <p className={styles['no-notes']}>
                  No extra details. Sometimes simple is all you need.
                </p>
              )}
            </div>
            <div className={styles['detail-created']}>
              <Icon name="calendar" size={14} />
              <span>
                Created{' '}
                <time dateTime={todo.createdAt}>
                  {new Intl.DateTimeFormat('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(todo.createdAt))}
                </time>
              </span>
            </div>
          </section>
          {mutationError && <ErrorNotice message={mutationError} />}
          <div className={styles['detail-actions']}>
            <button
              type="button"
              className={
                todo.completed
                  ? `${shared['button']} ${shared['button-secondary']}`
                  : `${shared['button']} ${shared['button-primary']}`
              }
              disabled={isSaving || isDeleting}
              onClick={onToggle}
            >
              <Icon name="check" size={17} />
              {isSaving
                ? 'Saving…'
                : todo.completed
                  ? 'Mark incomplete'
                  : 'Mark complete'}
            </button>
            <button
              type="button"
              className={styles['delete-task-button']}
              onClick={() => setConfirmingDelete(true)}
              disabled={isDeleting || isSaving || confirmingDelete}
            >
              <Icon name="trash" size={16} />
              Delete task
            </button>
          </div>
          {confirmingDelete && (
            <section
              className={styles['delete-confirmation']}
              aria-labelledby="delete-confirmation-title"
            >
              <div>
                <h2 id="delete-confirmation-title">Let this task go?</h2>
                <p>
                  This will permanently delete “{todo.title}” from this browser.
                </p>
              </div>
              <div className={styles['delete-confirmation-actions']}>
                <button
                  type="button"
                  className={`${shared['button']} ${shared['button-secondary']} ${styles['confirmation-button']}`}
                  disabled={isDeleting}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep task
                </button>
                <button
                  type="button"
                  className={`${shared['button']} ${shared['button-danger']} ${styles['confirmation-button']}`}
                  disabled={isDeleting}
                  onClick={onDelete}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete task'}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
