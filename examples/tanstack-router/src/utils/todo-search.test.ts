import { describe, expect, it } from 'vitest'
import { parseTodoSearch } from './todo-search'

describe('task search parameters', () => {
  it.each(['open', 'done'])(
    'preserves a valid %s filter and search text',
    (status) => {
      expect(parseTodoSearch({ q: '  plan the day  ', status })).toEqual({
        q: '  plan the day  ',
        status,
      })
    },
  )

  it.each(['', null, 42, false, ['task'], { text: 'task' }])(
    'discards malformed search text %j without losing a valid filter',
    (q) => {
      expect(parseTodoSearch({ q, status: 'open' })).toEqual({
        q: undefined,
        status: 'open',
      })
    },
  )

  it.each(['all', 'unknown', '', null, 42, ['open'], { value: 'open' }])(
    'discards malformed filter %j without losing valid search text',
    (status) => {
      expect(parseTodoSearch({ q: 'plan', status })).toEqual({
        q: 'plan',
        status: undefined,
      })
    },
  )

  it('allows an unfiltered list and strips unrecognized search parameters', () => {
    expect(parseTodoSearch({})).toEqual({})
    expect(
      parseTodoSearch({ q: 'plan', status: 'done', extra: 'ignored' }),
    ).toEqual({
      q: 'plan',
      status: 'done',
    })
  })
})
