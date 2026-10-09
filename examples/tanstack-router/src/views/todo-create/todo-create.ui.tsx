import type { ReactNode } from 'react'
import type { TodoInput } from '../../types/todo'
import type { TodoForm } from './types/todo-form'
import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from '../../constants/todos'
import { Icon } from '../../components/icon'
import { ErrorNotice } from '../../components/status-message'
import shared from '../../styles.module.css'
import styles from './todo-create.module.css'

interface TodoCreateUIProps {
  form: TodoForm
  isPending: boolean
  onSubmit: () => void
  cancelLink: ReactNode
  backLink?: ReactNode
}

export function TodoCreateUI({
  form,
  isPending,
  onSubmit,
  cancelLink,
  backLink,
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
          <TodoFieldsUI form={form} />
          <form.Subscribe
            selector={(state) =>
              // Standard Schema issues with paths are already shown by their fields.
              state.errors.find(
                (issue) =>
                  !(
                    'path' in issue &&
                    Array.isArray(issue.path) &&
                    issue.path.length
                  ),
              )?.message
            }
          >
            {(error) => error && <ErrorNotice message={error} />}
          </form.Subscribe>
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
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <TodoSubmitButtonUI isSaving={isSubmitting || isPending} />
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
      <p className={styles['form-footnote']}>
        You don’t need to do everything today. Just start somewhere.
      </p>
    </div>
  )
}

function TodoFieldsUI({ form }: { form: TodoForm }) {
  return (
    <>
      <form.Field name="title">
        {(field) => (
          <TodoTitleFieldUI
            value={field.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.errors[0]?.message}
          />
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <TodoDescriptionFieldUI
            value={field.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.errors[0]?.message}
          />
        )}
      </form.Field>
      <div className={styles['form-field-grid']}>
        <form.Field name="priority">
          {(field) => (
            <TodoPriorityFieldUI
              value={field.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.errors[0]?.message}
            />
          )}
        </form.Field>
        <form.Field name="dueDate">
          {(field) => (
            <TodoDueDateFieldUI
              value={field.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.errors[0]?.message}
            />
          )}
        </form.Field>
      </div>
    </>
  )
}

interface TodoFieldUIProps<TValue> {
  value: TValue
  onChange: (value: TValue) => void
  onBlur: () => void
  error?: string
}

function TodoTitleFieldUI({
  value,
  onChange,
  onBlur,
  error,
}: TodoFieldUIProps<TodoInput['title']>) {
  return (
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
        value={value}
        placeholder="What would you like to do?"
        required
        maxLength={TODO_TITLE_MAX_LENGTH}
        autoFocus
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'title-error' : 'title-hint'}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <div className={styles['field-hint-row']}>
        {error ? (
          <p className={styles['field-error']} id="title-error" role="alert">
            {error}
          </p>
        ) : (
          <p className={styles['field-hint']} id="title-hint">
            A small, clear action is a great place to start.
          </p>
        )}
        <span className={styles['character-count']}>
          {value.length}/{TODO_TITLE_MAX_LENGTH}
        </span>
      </div>
    </div>
  )
}

function TodoDescriptionFieldUI({
  value,
  onChange,
  onBlur,
  error,
}: TodoFieldUIProps<TodoInput['description']>) {
  return (
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
        value={value}
        placeholder="Add a little context, a reminder, or a few details…"
        rows={5}
        maxLength={TODO_DESCRIPTION_MAX_LENGTH}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'description-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error && (
        <p
          className={styles['field-error']}
          id="description-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function TodoPriorityFieldUI({
  value,
  onChange,
  onBlur,
  error,
}: TodoFieldUIProps<TodoInput['priority']>) {
  return (
    <div className={styles['form-field']}>
      <label htmlFor="task-priority">Priority</label>
      <select
        id="task-priority"
        name="priority"
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'priority-error' : 'priority-hint'}
        onChange={(event) =>
          onChange(event.target.value as TodoInput['priority'])
        }
        onBlur={onBlur}
      >
        <option value="low">Low priority</option>
        <option value="medium">Medium priority</option>
        <option value="high">High priority</option>
      </select>
      {error ? (
        <p className={styles['field-error']} id="priority-error" role="alert">
          {error}
        </p>
      ) : (
        <p className={styles['field-hint']} id="priority-hint">
          What needs your attention first?
        </p>
      )}
    </div>
  )
}

function TodoDueDateFieldUI({
  value,
  onChange,
  onBlur,
  error,
}: TodoFieldUIProps<TodoInput['dueDate']>) {
  return (
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
        value={value ?? ''}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'due-date-error' : undefined}
        onChange={(event) => onChange(event.target.value || null)}
        onBlur={onBlur}
      />
      {error ? (
        <p className={styles['field-error']} id="due-date-error" role="alert">
          {error}
        </p>
      ) : (
        <p className={styles['field-hint']}>
          Give it a day, or leave some space.
        </p>
      )}
    </div>
  )
}

function TodoSubmitButtonUI({ isSaving }: { isSaving: boolean }) {
  return (
    <button
      className={`${shared['button']} ${shared['button-primary']} ${styles['submit-button']}`}
      type="submit"
      disabled={isSaving}
    >
      <Icon name={isSaving ? 'check' : 'plus'} size={17} />
      {isSaving ? 'Saving…' : 'Create task'}
    </button>
  )
}
