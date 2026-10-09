import { createMemoryHistory } from '@tanstack/react-router'
import { onlineManager } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app'
import { TODOS_QUERY_KEY, TODOS_STORAGE_KEY } from '../src/constants/todos'
import { getRouter } from '../src/router'
import { createTodoRuntime } from '../src/services/todo-runtime'

type Runtime = ReturnType<typeof createTodoRuntime>
const runtimes: Runtime[] = []

function renderApp(path = '/', runtime = createTodoRuntime()) {
  runtimes.push(runtime)
  const router = getRouter(createMemoryHistory({ initialEntries: [path] }))
  const rendered = render(
    <StrictMode>
      <App runtime={runtime} router={router} />
    </StrictMode>,
  )
  return { ...rendered, router, runtime, user: userEvent.setup() }
}

async function createTask(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  notes = '',
  details?: { priority: string; dueDate: string },
) {
  const titleInput = await screen.findByRole('textbox', { name: 'Task title' })
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled()
  })
  await user.type(titleInput, title)
  if (notes)
    await user.type(screen.getByRole('textbox', { name: /^Notes/ }), notes)
  if (details) {
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Priority' }),
      details.priority,
    )
    fireEvent.change(screen.getByLabelText(/^Due date/), {
      target: { value: details.dueDate },
    })
    expect(screen.getByLabelText(/^Due date/)).toHaveValue(details.dueDate)
  }
  await user.click(screen.getByRole('button', { name: 'Create task' }))
  expect(
    await screen.findByRole('heading', { name: title.trim() }),
  ).toBeVisible()
}

function navigationLink(name: string) {
  return within(
    screen.getByRole('navigation', { name: 'Main navigation' }),
  ).getByRole('link', { name })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  // Unsubscribe persistence before clearing caches so teardown cannot overwrite
  // the snapshot that another app instance restores in a reload test.
  cleanup()
  runtimes.splice(0).forEach((runtime) => runtime.queryClient.clear())
  onlineManager.setOnline(true)
})

describe('the client-only task app', () => {
  it('renders an empty collection without inventing sample tasks', async () => {
    renderApp()

    expect(
      await screen.findByRole('heading', { name: /your tasks/i }),
    ).toBeVisible()
    expect(navigationLink('New task')).toHaveAttribute('href', '/todos/new')
    expect(
      await screen.findByRole('heading', {
        name: 'A fresh start, just for you.',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('list', { name: 'Tasks' }),
    ).not.toBeInTheDocument()
  })

  it('creates, lists, filters, completes, restores, and deletes a task through the UI', async () => {
    const firstSession = renderApp()
    await screen.findByRole('heading', { name: /your tasks/i })
    await firstSession.user.click(navigationLink('New task'))
    await createTask(
      firstSession.user,
      'Plan the garden',
      'Choose native plants.',
      { priority: 'high', dueDate: '2026-10-12' },
    )
    expect(screen.getByText('Choose native plants.')).toBeVisible()
    expect(screen.getByText('High priority')).toBeVisible()
    expect(screen.getByText('Oct 12, 2026')).toBeVisible()
    const detailPath = firstSession.router.state.location.pathname
    expect(detailPath).toMatch(/^\/todos\/.+/)

    await firstSession.user.click(navigationLink('All tasks'))
    const taskLink = await screen.findByRole('link', {
      name: 'Plan the garden',
    })
    expect(taskLink).toHaveAttribute('href', detailPath)
    await firstSession.user.click(
      screen.getByRole('checkbox', {
        name: 'Mark Plan the garden as complete',
      }),
    )
    await firstSession.user.click(
      screen.getByRole('button', { name: /completed\s*1/i }),
    )
    expect(
      screen.getByRole('checkbox', {
        name: 'Mark Plan the garden as incomplete',
      }),
    ).toBeChecked()

    await firstSession.user.type(
      screen.getByRole('searchbox', { name: 'Search tasks' }),
      'does not match',
    )
    expect(
      await screen.findByRole('heading', { name: 'No tasks found.' }),
    ).toBeVisible()
    await firstSession.user.click(
      screen.getByRole('button', { name: 'Clear search' }),
    )
    await firstSession.user.click(
      await screen.findByRole('link', { name: 'Plan the garden' }),
    )
    await screen.findByRole('button', { name: 'Mark incomplete' })

    // A reload gets a new QueryClient and starts directly on the detail route.
    firstSession.unmount()
    const secondSession = renderApp(detailPath)
    expect(
      await screen.findByRole('heading', { name: 'Plan the garden' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Mark incomplete' }),
    ).toBeVisible()
    expect(screen.getByText('High priority')).toBeVisible()
    expect(screen.getByText('Oct 12, 2026')).toBeVisible()
    await secondSession.user.click(
      screen.getByRole('button', { name: 'Delete task' }),
    )
    await secondSession.user.click(
      screen.getByRole('button', { name: 'Keep task' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Plan the garden' }),
    ).toBeVisible()
    await secondSession.user.click(
      screen.getByRole('button', { name: 'Delete task' }),
    )
    await secondSession.user.click(
      screen.getByRole('button', { name: 'Yes, delete task' }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'A fresh start, just for you.',
      }),
    ).toBeVisible()

    secondSession.unmount()
    renderApp()
    expect(
      await screen.findByRole('heading', {
        name: 'A fresh start, just for you.',
      }),
    ).toBeVisible()
    expect(
      screen.queryByRole('link', { name: 'Plan the garden' }),
    ).not.toBeInTheDocument()
  })

  it('keeps old saved tasks and adds to them after a fresh app restores', async () => {
    const firstSession = renderApp('/todos/new')
    await createTask(firstSession.user, 'A task for next month')
    const detailPath = firstSession.router.state.location.pathname
    firstSession.unmount()

    const saved = window.localStorage.getItem(TODOS_STORAGE_KEY)
    expect(saved).not.toBeNull()
    const snapshot = JSON.parse(saved!) as { timestamp: number }
    snapshot.timestamp -= 45 * 24 * 60 * 60 * 1000
    window.localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(snapshot))

    const secondSession = renderApp(detailPath)
    expect(
      await screen.findByRole('heading', { name: 'A task for next month' }),
    ).toBeVisible()
    await secondSession.user.click(navigationLink('New task'))
    await createTask(secondSession.user, 'A task for today')
    await secondSession.user.click(navigationLink('All tasks'))
    expect(
      await screen.findByRole('link', { name: 'A task for next month' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'A task for today' })).toBeVisible()
  })

  it('loads, creates, and completes tasks while offline', async () => {
    onlineManager.setOnline(false)
    const firstSession = renderApp()
    expect(
      await screen.findByRole('heading', {
        name: 'A fresh start, just for you.',
      }),
    ).toBeVisible()
    await firstSession.user.click(navigationLink('New task'))
    await createTask(firstSession.user, 'An offline next step')
    await firstSession.user.click(
      screen.getByRole('button', { name: 'Mark complete' }),
    )
    expect(
      await screen.findByRole('button', { name: 'Mark incomplete' }),
    ).toBeVisible()

    const detailPath = firstSession.router.state.location.pathname
    firstSession.unmount()
    renderApp(detailPath)
    expect(
      await screen.findByRole('heading', { name: 'An offline next step' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Mark incomplete' }),
    ).toBeVisible()
  })

  it('waits for saved tasks to restore before enabling creation', async () => {
    const firstSession = renderApp('/todos/new')
    await createTask(firstSession.user, 'An already saved task')
    firstSession.unmount()
    const saved = window.localStorage.getItem(TODOS_STORAGE_KEY)
    expect(saved).not.toBeNull()

    const runtime = createTodoRuntime()
    const restoreClient = runtime.persister.restoreClient
    let finishRestore!: () => void
    const restoreReady = new Promise<void>((resolve) => {
      finishRestore = resolve
    })
    runtime.persister.restoreClient = async () => {
      await restoreReady
      return restoreClient()
    }
    const { user, router } = renderApp('/todos/new', runtime)
    const title = await screen.findByRole('textbox', { name: 'Task title' })
    const submit = screen.getByRole('button', { name: 'Saving…' })

    expect(submit).toBeDisabled()
    await user.type(title, 'A new draft while restoring')
    await user.click(submit)
    expect(router.state.location.pathname).toBe('/todos/new')
    expect(window.localStorage.getItem(TODOS_STORAGE_KEY)).toBe(saved)

    await act(async () => {
      finishRestore()
      await restoreReady
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: 'Create task' }))
    expect(
      await screen.findByRole('heading', {
        name: 'A new draft while restoring',
      }),
    ).toBeVisible()
    await user.click(navigationLink('All tasks'))
    expect(
      await screen.findByRole('link', { name: 'An already saved task' }),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'A new draft while restoring' }),
    ).toBeVisible()
  })

  it('validates a whitespace-only title and allows the user to correct it', async () => {
    const { user, router } = renderApp('/todos/new')
    const title = await screen.findByRole('textbox', { name: 'Task title' })
    await user.type(title, '   ')
    await user.click(screen.getByRole('button', { name: 'Create task' }))
    expect(await screen.findByText('Give your task a title.')).toBeVisible()
    expect(router.state.location.pathname).toBe('/todos/new')
    await user.clear(title)
    await createTask(user, '  A clear next step  ')
    expect(
      screen.getByRole('heading', { name: 'A clear next step' }),
    ).toBeVisible()
  })

  it('keeps a title error while other fields change and revalidates the corrected title', async () => {
    const { user, router, runtime } = renderApp('/todos/new')
    const title = await screen.findByRole('textbox', { name: 'Task title' })
    const submit = screen.getByRole('button', { name: 'Create task' })
    await waitFor(() => expect(submit).toBeEnabled())

    await user.click(submit)
    expect(await screen.findByText('Give your task a title.')).toBeVisible()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(router.state.location.pathname).toBe('/todos/new')
    expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY) ?? []).toEqual([])

    await user.type(
      screen.getByRole('textbox', { name: /^Notes/ }),
      'Remember the gloves.',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Priority' }),
      'high',
    )
    expect(screen.getByText('Give your task a title.')).toBeVisible()
    expect(title).toHaveAttribute('aria-invalid', 'true')

    await user.type(title, 'Tend the garden')
    await waitFor(() => {
      expect(
        screen.queryByText('Give your task a title.'),
      ).not.toBeInTheDocument()
      expect(title).toHaveAttribute('aria-invalid', 'false')
    })
    expect(router.state.location.pathname).toBe('/todos/new')
    expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY) ?? []).toEqual([])

    await user.click(submit)
    expect(
      await screen.findByRole('heading', { name: 'Tend the garden' }),
    ).toBeVisible()
    expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY)).toEqual([
      expect.objectContaining({
        title: 'Tend the garden',
        description: 'Remember the gloves.',
        priority: 'high',
      }),
    ])
  })

  it('preserves the draft after a submission error and allows a successful retry', async () => {
    const runtime = createTodoRuntime()
    const createTodo = vi
      .spyOn(runtime, 'createTodo')
      .mockImplementationOnce(() => {
        throw new Error('Could not create this task.')
      })
    const { user, router } = renderApp('/todos/new', runtime)
    const title = await screen.findByRole('textbox', { name: 'Task title' })
    await user.type(title, 'Try again with this draft')
    const submit = screen.getByRole('button', { name: 'Create task' })
    await waitFor(() => expect(submit).toBeEnabled())

    await user.click(submit)
    expect(await screen.findByText('Could not create this task.')).toBeVisible()
    expect(title).toHaveValue('Try again with this draft')
    expect(router.state.location.pathname).toBe('/todos/new')
    expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY) ?? []).toEqual([])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Create task' }))
    expect(
      await screen.findByRole('heading', { name: 'Try again with this draft' }),
    ).toBeVisible()
    expect(createTodo).toHaveBeenCalledTimes(2)
    expect(runtime.queryClient.getQueryData(TODOS_QUERY_KEY)).toEqual([
      expect.objectContaining({ title: 'Try again with this draft' }),
    ])
  })

  it('preserves malformed storage and clearly makes new changes session-only', async () => {
    const original = '{"unfinished":'
    window.localStorage.setItem(TODOS_STORAGE_KEY, original)
    const { user } = renderApp('/todos/new')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Saved tasks could not be read.',
    )
    await createTask(user, 'A task in this session')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'will be lost on reload',
    )
    expect(window.localStorage.getItem(TODOS_STORAGE_KEY)).toBe(original)
  })

  it('keeps the app usable when the browser denies storage access', async () => {
    function deniedStorage(): never {
      throw new DOMException('Storage access denied.', 'SecurityError')
    }
    const runtime = createTodoRuntime({
      storage: {
        getItem: deniedStorage,
        setItem: deniedStorage,
        removeItem: deniedStorage,
      },
    })
    const { user } = renderApp('/todos/new', runtime)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Browser storage is unavailable.',
    )
    await createTask(user, 'Keep working in this tab')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'changes will be lost when you reload',
    )
  })

  it('shows a helpful missing-task state for a stale detail link', async () => {
    renderApp('/todos/not-a-saved-task')

    expect(
      await screen.findByRole('heading', { name: 'This task has moved on.' }),
    ).toBeVisible()
    expect(navigationLink('All tasks')).toHaveAttribute('href', '/')
  })
})
