import { Link, Outlet } from '@tanstack/react-router'
import { AppShellUI } from '../../components/app-shell'
import { useStorageStatus } from '../../hooks/use-todos'

export function ShellView() {
  const storage = useStorageStatus()

  return (
    <AppShellUI
      allTasksLink={
        <Link to="/" search={{}} activeOptions={{ exact: true }}>
          All tasks
        </Link>
      }
      createTaskLink={<Link to="/todos/new">New task</Link>}
      persistenceWarning={storage.message}
    >
      <Outlet />
    </AppShellUI>
  )
}
