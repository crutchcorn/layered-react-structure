import type { ReactNode } from 'react'
import type { TodoInput } from '../../types/todo'
import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from '../../constants/todos'
import { Icon } from '../../components/icon'
import { ErrorNotice } from '../../components/status-message'
import shared from '../../styles.module.css'
import styles from './todo-create.module.css'

interface TodoCreateUIProps {
  values: TodoInput
  onChange: (patch: Partial<TodoInput>) => void
  onSubmit: () => void
  cancelLink: ReactNode
  backLink?: ReactNode
  isSaving: boolean
  error?: string | null
  fieldErrors?: { title?: string; description?: string; dueDate?: string }
}

export function TodoCreateUI({
  values,
  onChange,
  onSubmit,
  cancelLink,
  backLink,
  isSaving,
  error,
  fieldErrors,
}: TodoCreateUIProps) {
  return (
    <div className={styles['focused-page']}>
      <div className={styles['back-link']}>
        <Icon name="arrow" size={16} />
        {backLink ?? cancelLink}
      </div>
      <div className={`${shared['page-heading']} ${styles['form-heading']}`}>
        <div>
          <p className={shared['eyebrow']}>FROM ON YOUR MIND TO ON YOUR LIST</p>
          <h1 className={shared['page-title']}>
            Make a little room
            <span className={shared['heading-period']}>.</span>
          </h1>
          <p className={shared['page-description']}>
            A thought, a plan, a next step. Give it a place to start.
          </p>
        </div>
      </div>
      <form
        className={styles['task-form']}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className={styles['form-introduction']}>
          <span className={styles['form-symbol']}>
            <Icon name="plus" size={20} />
          </span>
          <div>
            <h2>A new task</h2>
            <p>Keep it simple. You can do this.</p>
          </div>
        </div>
        <div className={styles['form-fields']}>
          <div className={styles['form-field']}>
            <label htmlFor="task-title">
              Task title{' '}
              <span className={styles['required-note']} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              value={values.title}
              placeholder="What would you like to do?"
              required
              maxLength={TODO_TITLE_MAX_LENGTH}
              autoFocus
              aria-invalid={Boolean(fieldErrors?.title)}
              aria-describedby={
                fieldErrors?.title ? 'title-error' : 'title-hint'
              }
              onChange={(event) => onChange({ title: event.target.value })}
            />
            <div className={styles['field-hint-row']}>
              {fieldErrors?.title ? (
                <p
                  className={styles['field-error']}
                  id="title-error"
                  role="alert"
                >
                  {fieldErrors.title}
                </p>
              ) : (
                <p className={styles['field-hint']} id="title-hint">
                  A small, clear action is a great place to start.
                </p>
              )}
              <span className={styles['character-count']}>
                {values.title.length}/{TODO_TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>
          <div className={styles['form-field']}>
            <label htmlFor="task-notes">
              Notes{' '}
              <span className={styles['optional-note']} aria-hidden="true">
                Optional
              </span>
            </label>
            <textarea
              id="task-notes"
              name="description"
              value={values.description}
              placeholder="Add a little context, a reminder, or a few details…"
              rows={5}
              maxLength={TODO_DESCRIPTION_MAX_LENGTH}
              aria-invalid={Boolean(fieldErrors?.description)}
              aria-describedby={
                fieldErrors?.description ? 'description-error' : undefined
              }
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
            {fieldErrors?.description && (
              <p
                className={styles['field-error']}
                id="description-error"
                role="alert"
              >
                {fieldErrors.description}
              </p>
            )}
          </div>
          <div className={styles['form-field-grid']}>
            <div className={styles['form-field']}>
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                name="priority"
                value={values.priority}
                onChange={(event) =>
                  onChange({
                    priority: event.target.value as TodoInput['priority'],
                  })
                }
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <p className={styles['field-hint']}>
                What needs your attention first?
              </p>
            </div>
            <div className={styles['form-field']}>
              <label htmlFor="task-due-date">
                Due date{' '}
                <span className={styles['optional-note']} aria-hidden="true">
                  Optional
                </span>
              </label>
              <input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={values.dueDate ?? ''}
                aria-invalid={Boolean(fieldErrors?.dueDate)}
                aria-describedby={
                  fieldErrors?.dueDate ? 'due-date-error' : undefined
                }
                onChange={(event) =>
                  onChange({ dueDate: event.target.value || null })
                }
              />
              {fieldErrors?.dueDate ? (
                <p
                  className={styles['field-error']}
                  id="due-date-error"
                  role="alert"
                >
                  {fieldErrors.dueDate}
                </p>
              ) : (
                <p className={styles['field-hint']}>
                  Give it a day, or leave some space.
                </p>
              )}
            </div>
          </div>
          {error && <ErrorNotice message={error} />}
        </div>
        <div className={styles['form-actions']}>
          <span className={styles['form-private-note']}>
            <Icon name="shield" size={15} />
            Saved on this device
          </span>
          <div className={styles['form-action-buttons']}>
            <div
              className={`${shared['button-slot']} ${shared['secondary-button-slot']} ${styles['cancel-link']}`}
            >
              {cancelLink}
            </div>
            <button
              className={`${shared['button']} ${shared['button-primary']} ${styles['submit-button']}`}
              type="submit"
              disabled={isSaving}
            >
              <Icon name={isSaving ? 'check' : 'plus'} size={17} />
              {isSaving ? 'Saving…' : 'Create task'}
            </button>
          </div>
        </div>
      </form>
      <p className={styles['form-footnote']}>
        You don’t need to do everything today. Just start somewhere.
      </p>
    </div>
  )
}
