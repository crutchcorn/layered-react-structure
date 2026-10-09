import * as v from 'valibot'
import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from '../constants/todos'

export const TodoPrioritySchema = v.picklist(
  ['low', 'medium', 'high'],
  'Choose a low, medium, or high priority.',
)

const TodoTitleSchema = v.pipe(
  v.string('Give your task a title.'),
  v.regex(/\S/u, 'Give your task a title.'),
  v.maxLength(
    TODO_TITLE_MAX_LENGTH,
    `Keep the title to ${TODO_TITLE_MAX_LENGTH} characters.`,
  ),
)

const TodoDescriptionSchema = v.pipe(
  v.string(),
  v.maxLength(
    TODO_DESCRIPTION_MAX_LENGTH,
    `Keep the notes to ${TODO_DESCRIPTION_MAX_LENGTH.toLocaleString()} characters.`,
  ),
)

const DueDateSchema = v.nullable(
  v.pipe(
    v.string('Choose a valid due date.'),
    v.isoDate('Choose a valid due date.'),
    // isoDate checks the format; this also rejects dates such as February 30.
    v.check((value) => {
      const date = new Date(`${value}T00:00:00.000Z`)
      return (
        !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
      )
    }, 'Choose a valid due date.'),
  ),
)

const TimestampSchema = v.pipe(
  v.string(),
  v.check((value) => Number.isFinite(Date.parse(value)), 'Invalid timestamp.'),
)

export const TodoInputSchema = v.object({
  title: v.pipe(v.string('Give your task a title.'), v.trim(), TodoTitleSchema),
  description: v.pipe(v.string(), v.trim(), TodoDescriptionSchema),
  priority: TodoPrioritySchema,
  dueDate: DueDateSchema,
})

export const TodoSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  title: TodoTitleSchema,
  description: TodoDescriptionSchema,
  completed: v.boolean(),
  priority: TodoPrioritySchema,
  dueDate: DueDateSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const TodoListSchema = v.pipe(
  v.array(TodoSchema),
  v.check(
    (todos) => new Set(todos.map((todo) => todo.id)).size === todos.length,
    'Saved tasks must have unique IDs.',
  ),
)
