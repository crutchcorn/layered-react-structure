import * as v from 'valibot'

export const TodoSearchSchema = v.object({
  q: v.fallback(v.optional(v.pipe(v.string(), v.nonEmpty())), undefined),
  status: v.fallback(v.optional(v.picklist(['open', 'done'])), undefined),
})

export function parseTodoSearch(search: Record<string, unknown>) {
  return v.parse(TodoSearchSchema, search)
}
