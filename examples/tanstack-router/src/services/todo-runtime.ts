import { QueryClient, hashKey } from '@tanstack/query-core'
import * as v from 'valibot'
import type {
  PersistedClient,
  Persister,
  PersistQueryClientOptions,
} from '@tanstack/query-persist-client-core'
import {
  TODOS_CACHE_VERSION,
  TODOS_QUERY_KEY,
  TODOS_STORAGE_KEY,
} from '../constants/todos'
import type { StorageStatus, Todo, TodoInput } from '../types/todo'
import {
  deleteTodoFromList,
  toggleTodoInList,
  validateTodoInput,
} from '../utils/todos'
import { TodoListSchema } from '../utils/todo-schema'

type TodoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

interface TodoRuntimeOptions {
  storage?: TodoStorage
}

const PersistedClientSchema = v.object({
  timestamp: v.pipe(v.number(), v.finite(), v.gtValue(0)),
  buster: v.literal(TODOS_CACHE_VERSION),
  clientState: v.object({
    queries: v.pipe(
      v.array(
        v.object({
          queryKey: v.strictTuple([v.literal(TODOS_QUERY_KEY[0])]),
          state: v.object({
            data: TodoListSchema,
            dataUpdatedAt: v.pipe(v.number(), v.finite()),
          }),
        }),
      ),
      v.maxLength(1),
    ),
    mutations: v.strictTuple([]),
  }),
})

const QuotaErrorSchema = v.object({
  name: v.picklist(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED']),
})

// Only validated domain records enter the cache. Other persisted query metadata
// is rebuilt rather than trusted as executable application state.
function readPersistedClient(value: unknown): PersistedClient {
  const { timestamp, clientState } = v.parse(PersistedClientSchema, value)
  const queries = clientState.queries.map((query) => ({
    queryKey: TODOS_QUERY_KEY,
    queryHash: hashKey(TODOS_QUERY_KEY),
    dehydratedAt: timestamp,
    state: {
      data: query.state.data,
      dataUpdatedAt: query.state.dataUpdatedAt,
      dataUpdateCount: 1,
      error: null,
      errorUpdatedAt: 0,
      errorUpdateCount: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      isInvalidated: false,
      status: 'success' as const,
      fetchStatus: 'idle' as const,
    },
  }))

  return {
    timestamp,
    buster: TODOS_CACHE_VERSION,
    clientState: { mutations: [], queries },
  }
}

export function getTodosQueryOptions(queryClient: QueryClient) {
  return {
    queryKey: TODOS_QUERY_KEY,
    // This client-only app has no remote source. Reading the canonical cache
    // also means a manual refetch can never replace restored tasks with [].
    queryFn: () => queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? [],
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: 'always' as const,
  }
}

export function createTodoRuntime(options: TodoRuntimeOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        networkMode: 'always',
        retry: false,
      },
      mutations: { networkMode: 'always', retry: false },
    },
  })
  let status: StorageStatus = { kind: 'available', message: null }
  const listeners = new Set<() => void>()
  let storage: TodoStorage | undefined
  let preserveUnreadStorage = false

  function updateStatus(next: StorageStatus) {
    if (status.kind === next.kind && status.message === next.message) return
    status = next
    listeners.forEach((listener) => listener())
  }

  function storageFailed(error: unknown) {
    const isQuotaError = v.is(QuotaErrorSchema, error)

    updateStatus({
      kind: isQuotaError ? 'quota-exceeded' : 'unavailable',
      message: isQuotaError
        ? 'Browser storage is full. Your latest changes are only available in this tab until space is freed.'
        : 'Browser storage is unavailable. Your tasks work in this tab, but changes will be lost when you reload.',
    })
  }

  try {
    storage = options.storage ?? window.localStorage
  } catch (error) {
    storageFailed(error)
  }

  const persister: Persister = {
    persistClient(client) {
      if (!storage || preserveUnreadStorage) return

      try {
        // Deliberately synchronous: completing a task and immediately reloading
        // must not lose the last update to a throttled storage write.
        storage.setItem(TODOS_STORAGE_KEY, JSON.stringify(client))
        updateStatus({ kind: 'available', message: null })
      } catch (error) {
        storageFailed(error)
      }
    },
    restoreClient() {
      if (!storage) return undefined

      let saved: string | null
      try {
        saved = storage.getItem(TODOS_STORAGE_KEY)
      } catch (error) {
        preserveUnreadStorage = true
        storageFailed(error)
        return undefined
      }

      if (saved === null) return undefined

      try {
        return readPersistedClient(JSON.parse(saved))
      } catch {
        // Preserve the original data for recovery rather than overwriting an
        // unreadable snapshot with a new, empty task collection.
        preserveUnreadStorage = true
        updateStatus({
          kind: 'invalid-data',
          message:
            'Saved tasks could not be read. The original browser data is preserved; new changes are only available in this tab and will be lost on reload.',
        })
        return undefined
      }
    },
    removeClient() {
      if (!storage || preserveUnreadStorage) return

      try {
        storage.removeItem(TODOS_STORAGE_KEY)
      } catch (error) {
        storageFailed(error)
      }
    },
  }

  const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
    persister,
    buster: TODOS_CACHE_VERSION,
    // The cache is the data store, so tasks must not expire after inactivity.
    maxAge: Infinity,
    dehydrateOptions: {
      shouldDehydrateMutation: () => false,
      shouldDehydrateQuery: (query) =>
        query.queryHash === hashKey(TODOS_QUERY_KEY) &&
        query.state.status === 'success',
    },
  }

  return {
    queryClient,
    persister,
    persistOptions,
    storageStatus: {
      subscribe(listener: () => void) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      getSnapshot: () => status,
    },
    createTodo(input: TodoInput): Todo {
      const values = validateTodoInput(input)
      const timestamp = new Date().toISOString()
      const todo: Todo = {
        ...values,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (todos = []) => [
        todo,
        ...todos,
      ])
      return todo
    },
    toggleTodo(id: string): Todo {
      const todos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY) ?? []
      const updated = toggleTodoInList(todos, id, new Date().toISOString())
      queryClient.setQueryData(TODOS_QUERY_KEY, updated)
      return updated.find((todo) => todo.id === id)!
    },
    deleteTodo(id: string) {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (todos = []) =>
        deleteTodoFromList(todos, id),
      )
    },
  }
}
