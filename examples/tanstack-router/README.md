# Daybook

A client-only TODO app built with TanStack Router, TanStack Query, and Layered React Structure (LRS). Create tasks with notes, priorities, and optional due dates; find them with search and status filters; open a task to complete or delete it. There is no server or account.

## Run locally

From the repository root:

```sh
pnpm install
pnpm --filter tanstack-router dev
```

Open the URL printed by Vite. The default port is 3000. For another port, use `pnpm --filter tanstack-router dev --port 4317`.

## Pages

| URL              | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `/`              | List, search, filter, and complete tasks |
| `/todos/new`     | Create a task                            |
| `/todos/$todoId` | Read, complete, or delete a task         |

Search and status filters live in URL search parameters (`q` and `status`). Invalid search parameters fall back to the default list. Detail URLs work after a reload, and missing tasks have a dedicated empty state. Router entry files delegate to views; Vite generates `src/routeTree.gen.ts` and splits route components automatically. Static hosting must serve `index.html` for application paths.

## LRS boundaries

| Location                       | Responsibility                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `src/app.tsx`                  | Compose the runtime, persistence provider, and router                            |
| `src/routes/`                  | Thin TanStack Router entries                                                     |
| `src/views/`                   | Connect queries, mutations, form state, navigation, and UI                       |
| `src/views/**/*.ui.tsx`        | Render data and callbacks without importing services or TanStack libraries       |
| `src/components/`              | Shared presentational components and styles                                      |
| `src/hooks/`                   | React Query hooks, runtime context, storage status subscription, and page titles |
| `src/services/`                | Browser I/O, persistence, and the framework-independent Query runtime            |
| `src/utils/`                   | Pure validation, task transformations, and URL parsing                           |
| `src/types/`, `src/constants/` | Shared domain contracts and fixed values                                         |

The workspace `lrs-eslint-plugin` checks presentation and service import boundaries. Its optional strict folder preset is intentionally not enabled because TanStack Router owns the `routes/` and generated filenames. Router links enter presentational components through slots, keeping navigation in views.

Styles are scoped with colocated `.module.css` files. Shared presentation classes live in `src/styles.module.css`; its explicit `:global(...)` selectors provide the document reset, theme, and accessibility defaults.

Valibot schemas in `src/utils/` validate task input, saved task records, and URL filters. Shared domain types are inferred from the schemas. The runtime validates the persistence envelope before restoring the cache, and the creation form maps schema issues to field errors. Custom schema checks handle calendar dates and unique task IDs.

## Persistence

The Query cache is the single task store. [`PersistQueryClientProvider`](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) restores it before queries run; mutation hooks also prevent edits during restoration. A small custom `Persister` in `services/todo-runtime.ts` writes the dehydrated task query synchronously to the `lrs-todos-v1` localStorage key. Synchronous writes avoid losing the last change to a throttled save when a tab closes immediately.

Both `gcTime` and persistence `maxAge` are `Infinity`: these records are the user's data, so inactivity must not discard them. `staleTime: Infinity` avoids unnecessary refetches, and the query function reads the current cache so an explicit refetch preserves tasks. Queries and mutations use `networkMode: 'always'` because they require no network. This is a client-only app, not an installable offline PWA; loading the app itself still requires its static files.

Only the task query is persisted, never mutation state. Restoration validates the snapshot and every task before hydrating. Invalid or unreadable saved data is preserved, and a visible warning explains that new changes are session-only. Quota or storage-access failures also show a warning; a later successful save clears it. The snapshot version is explicit so future schema changes can introduce deliberate migrations.

Storage belongs to this browser and origin. Clearing site data removes tasks. The example has no cross-device sync or cross-tab reconciliation; simultaneous editing in multiple tabs uses the last saved snapshot. Use one editing tab at a time.

## Checks

From the repository root, Nx builds the local ESLint plugin before running the checks:

```sh
pnpm exec nx run-many -t test:eslint test:types test:lib build -p tanstack-router
pnpm --filter tanstack-router check
```

Vitest and React Testing Library exercise the real router, views, Query provider, and localStorage in React StrictMode. Tests cover creation, navigation, search/filtering, completion, deletion, deep-link reloads, retention beyond 24 hours, validation, missing tasks, corrupt snapshots, denied reads, and quota recovery. Service tests also verify immediate persistence and explicit refetch behavior.
