import { RouterProvider } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { TodoRuntimeContext } from './hooks/use-todos'
import type { getRouter } from './router'
import type { createTodoRuntime } from './services/todo-runtime'

interface AppProps {
  runtime: ReturnType<typeof createTodoRuntime>
  router: ReturnType<typeof getRouter>
}

export function App({ runtime, router }: AppProps) {
  return (
    <TodoRuntimeContext.Provider value={runtime}>
      <PersistQueryClientProvider
        client={runtime.queryClient}
        persistOptions={runtime.persistOptions}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </TodoRuntimeContext.Provider>
  )
}
