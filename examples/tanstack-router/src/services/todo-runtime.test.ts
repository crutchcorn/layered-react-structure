import { describe, expect, it, vi } from 'vitest'
import {
  persistQueryClientRestore,
  persistQueryClientSave,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import {
  TODOS_QUERY_KEY,
  TODOS_STORAGE_KEY,
  TODO_TITLE_MAX_LENGTH,
} from '../constants/todos'
import { createTodoRuntime, getTodosQueryOptions } from './todo-runtime'
import type { PersistedClient } from '@tanstack/query-persist-client-core'
import type { Todo } from '../types/todo'

function createStorage() {
  const entries = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => entries.set(key, value)),
    removeItem: vi.fn((key: string) => entries.delete(key)),
  }
}

const input = {
  title: 'Prepare the example',
  description: 'Show how the layers fit together.',
  priority: 'medium' as const,
  dueDate: null,
}

describe('the persisted task cache', () => {
  it('persists mutations synchronously and retains data on an explicit refetch', async () => {
    const storage = createStorage()
    const runtime = createTodoRuntime({ storage })
    await persistQueryClientRestore({
      queryClient: runtime.queryClient,
      ...runtime.persistOptions,
    })
    const unsubscribe = persistQueryClientSubscribe({
      queryClient: runtime.queryClient,
      ...runtime.persistOptions,
    })

    try {
      const todo = runtime.createTodo(input)
      expect(storage.getItem(TODOS_STORAGE_KEY)).toContain(todo.id)

      runtime.toggleTodo(todo.id)
      expect(storage.getItem(TODOS_STORAGE_KEY)).toContain('"completed":true')

      await runtime.queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
      const refreshed = await runtime.queryClient.fetchQuery(
        getTodosQueryOptions(runtime.queryClient),
      )
      expect(refreshed).toEqual([
        { ...todo, completed: true, updatedAt: expect.any(String) },
      ])
    } finally {
      unsubscribe()
      runtime.queryClient.clear()
    }
  })

  it('preserves unread storage even if later writes would succeed', async () => {
    const storage = createStorage()
    storage.getItem.mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    const runtime = createTodoRuntime({ storage })
    await persistQueryClientRestore({
      queryClient: runtime.queryClient,
      ...runtime.persistOptions,
    })

    runtime.createTodo(input)
    await persistQueryClientSave({
      queryClient: runtime.queryClient,
      ...runtime.persistOptions,
    })

    expect(runtime.storageStatus.getSnapshot().kind).toBe('unavailable')
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(
      runtime.queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY),
    ).toHaveLength(1)
    runtime.queryClient.clear()
  })

  it.each(['invalid record', 'duplicate IDs'])(
    'preserves a snapshot with %s',
    async (scenario) => {
      const storage = createStorage()
      const original = createTodoRuntime({ storage })
      const todo = original.createTodo(input)
      original.queryClient.setQueryData(
        TODOS_QUERY_KEY,
        scenario === 'duplicate IDs'
          ? [todo, todo]
          : [{ ...todo, dueDate: '2026-02-30' }],
      )
      await persistQueryClientSave({
        queryClient: original.queryClient,
        ...original.persistOptions,
      })
      const snapshot = storage.getItem(TODOS_STORAGE_KEY)
      original.queryClient.clear()

      const restored = createTodoRuntime({ storage })
      await persistQueryClientRestore({
        queryClient: restored.queryClient,
        ...restored.persistOptions,
      })
      restored.createTodo({ ...input, title: 'A session-only task' })
      await persistQueryClientSave({
        queryClient: restored.queryClient,
        ...restored.persistOptions,
      })

      expect(restored.storageStatus.getSnapshot().kind).toBe('invalid-data')
      expect(storage.getItem(TODOS_STORAGE_KEY)).toBe(snapshot)
      restored.queryClient.clear()
    },
  )

  it.each([
    {
      scenario: 'an unsupported cache version',
      corrupt: (client: PersistedClient) => ({ ...client, buster: 'future' }),
    },
    ...[
      { scenario: 'an unrelated query key', queryKey: ['other'] },
      { scenario: 'extra query key entries', queryKey: ['todos', 'extra'] },
    ].map(({ scenario, queryKey }) => ({
      scenario,
      corrupt: (client: PersistedClient) => ({
        ...client,
        clientState: {
          ...client.clientState,
          queries: client.clientState.queries.map((query) => ({
            ...query,
            queryKey,
          })),
        },
      }),
    })),
    {
      scenario: 'an invalid query timestamp',
      corrupt: (client: PersistedClient) => ({
        ...client,
        clientState: {
          ...client.clientState,
          queries: client.clientState.queries.map((query) => ({
            ...query,
            state: { ...query.state, dataUpdatedAt: 'yesterday' },
          })),
        },
      }),
    },
    {
      scenario: 'unexpected mutations',
      corrupt: (client: PersistedClient) => ({
        ...client,
        clientState: { ...client.clientState, mutations: [{}] },
      }),
    },
  ])('preserves a snapshot with $scenario', async ({ corrupt }) => {
    const storage = createStorage()
    const original = createTodoRuntime({ storage })
    original.createTodo(input)
    await persistQueryClientSave({
      queryClient: original.queryClient,
      ...original.persistOptions,
    })
    const client = JSON.parse(
      storage.getItem(TODOS_STORAGE_KEY)!,
    ) as PersistedClient
    const snapshot = JSON.stringify(corrupt(client))
    storage.setItem(TODOS_STORAGE_KEY, snapshot)
    storage.setItem.mockClear()
    original.queryClient.clear()

    const restored = createTodoRuntime({ storage })
    await persistQueryClientRestore({
      queryClient: restored.queryClient,
      ...restored.persistOptions,
    })

    expect(restored.storageStatus.getSnapshot().kind).toBe('invalid-data')
    expect(restored.queryClient.getQueryData(TODOS_QUERY_KEY)).toBeUndefined()
    restored.createTodo({ ...input, title: 'A session-only task' })
    await persistQueryClientSave({
      queryClient: restored.queryClient,
      ...restored.persistOptions,
    })

    expect(storage.getItem(TODOS_STORAGE_KEY)).toBe(snapshot)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
    restored.queryClient.clear()
  })

  it.each([
    { title: '   ' },
    { title: 'x'.repeat(TODO_TITLE_MAX_LENGTH + 1) },
    { dueDate: '2025-02-29' },
  ])(
    'rejects invalid creation without changing existing tasks: %j',
    (invalid) => {
      const runtime = createTodoRuntime({ storage: createStorage() })
      const existing = runtime.createTodo(input)

      expect(() => runtime.createTodo({ ...input, ...invalid })).toThrow()
      expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY)).toEqual([
        existing,
      ])
      runtime.queryClient.clear()
    },
  )

  it('trims task input and restores a valid leap-day due date', async () => {
    const storage = createStorage()
    const original = createTodoRuntime({ storage })
    const todo = original.createTodo({
      ...input,
      title: `  ${input.title}  `,
      description: `  ${input.description}  `,
      dueDate: '2028-02-29',
    })
    expect(todo).toMatchObject({
      ...input,
      dueDate: '2028-02-29',
    })
    await persistQueryClientSave({
      queryClient: original.queryClient,
      ...original.persistOptions,
    })
    original.queryClient.clear()

    const restored = createTodoRuntime({ storage })
    await persistQueryClientRestore({
      queryClient: restored.queryClient,
      ...restored.persistOptions,
    })

    expect(restored.queryClient.getQueryData(TODOS_QUERY_KEY)).toEqual([todo])
    expect(restored.storageStatus.getSnapshot().kind).toBe('available')
    restored.queryClient.clear()
  })

  it('warns about quota errors and clears the warning after a successful save', async () => {
    const storage = createStorage()
    const runtime = createTodoRuntime({ storage })
    runtime.createTodo(input)
    storage.setItem.mockImplementationOnce(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })
    const options = {
      queryClient: runtime.queryClient,
      ...runtime.persistOptions,
    }

    await persistQueryClientSave(options)
    expect(runtime.storageStatus.getSnapshot().kind).toBe('quota-exceeded')

    await persistQueryClientSave(options)
    expect(runtime.storageStatus.getSnapshot()).toEqual({
      kind: 'available',
      message: null,
    })
    expect(storage.getItem(TODOS_STORAGE_KEY)).toContain(input.title)
    runtime.queryClient.clear()
  })
})
