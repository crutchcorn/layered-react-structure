import { formOptions } from '@tanstack/react-form'
import { TodoInputSchema } from '../../../utils/todo-schema'
import type { TodoInput } from '../../../types/todo'

const defaultValues: TodoInput = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: null,
}

export const todoFormOptions = formOptions({
  defaultValues,
  validators: [
    {
      run: TodoInputSchema,
      // Submit validates every field; later edits revalidate without clearing
      // errors belonging to unrelated fields.
      triggers: [
        {
          trigger: 'change',
          when: ({ formApi }) => formApi.state.submissionAttempts > 0,
        },
      ],
    },
  ],
})
