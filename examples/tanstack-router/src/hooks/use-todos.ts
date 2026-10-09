import { createContext, useContext, useSyncExternalStore } from 'react'
import { useIsRestoring, useMutation, useQuery } from '@tanstack/react-query'
import { getTodosQueryOptions } from '../services/todo-runtime'
import type { createTodoRuntime } from '../services/todo-runtime'
import type { TodoInput } from '../types/todo'

export const TodoRuntimeContext = createContext<ReturnType<
  typeof createTodoRuntime
> | null>(null)

function useTodoRuntime() {
  const runtime = useContext(TodoRuntimeContext)
  if (!runtime) throw new Error('TodoRuntimeContext is missing.')
  return runtime
}

export function useStorageStatus() {
  const { storageStatus } = useTodoRuntime()
  return useSyncExternalStore(
    storageStatus.subscribe,
    storageStatus.getSnapshot,
    storageStatus.getSnapshot,
  )
}

export function useTodos() {
  const runtime = useTodoRuntime()
  const isRestoring = useIsRestoring()
  const query = useQuery(getTodosQueryOptions(runtime.queryClient))
  return { ...query, isRestoring }
}

export function useTodoActions() {
  const runtime = useTodoRuntime()
  const isRestoring = useIsRestoring()

  function ensureRestored() {
    if (isRestoring)
      throw new Error('Wait for your saved tasks to finish loading.')
  }

  const create = useMutation({
    mutationFn: (input: TodoInput) => {
      ensureRestored()
      return Promise.resolve(runtime.createTodo(input))
    },
  })
  const toggle = useMutation({
    mutationFn: (id: string) => {
      ensureRestored()
      return Promise.resolve(runtime.toggleTodo(id))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => {
      ensureRestored()
      return Promise.resolve(runtime.deleteTodo(id))
    },
  })

  return {
    createTodo: create.mutateAsync,
    toggleTodo: toggle.mutateAsync,
    deleteTodo: remove.mutateAsync,
    isPending:
      isRestoring || create.isPending || toggle.isPending || remove.isPending,
    error: create.error ?? toggle.error ?? remove.error,
  }
}
