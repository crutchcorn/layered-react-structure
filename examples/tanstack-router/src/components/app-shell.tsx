import type { ReactNode } from 'react'
import { Icon } from './icon'
import styles from './app-shell.module.css'

export function AppShellUI({
  children,
  allTasksLink,
  createTaskLink,
  persistenceWarning,
}: {
  children: ReactNode
  allTasksLink: ReactNode
  createTaskLink: ReactNode
  persistenceWarning?: ReactNode
}) {
  return (
    <div className={styles['app-shell']}>
      <a className={styles['skip-link']} href="#main-content">
        Skip to content
      </a>
      <aside className={styles['sidebar']}>
        <div className={styles['brand']}>
          <span className={styles['brand-mark']}>
            <Icon name="check" size={23} />
          </span>
          <span>
            daybook<span className={styles['brand-period']}>.</span>
          </span>
        </div>
        <div className={styles['workspace-label']}>
          YOUR EVERYDAY, ORGANIZED
        </div>
        <nav
          className={styles['primary-navigation']}
          aria-label="Main navigation"
        >
          <div className={styles['navigation-item']}>
            <Icon name="list" />
            {allTasksLink}
          </div>
          <div className={styles['navigation-item']}>
            <Icon name="plus" />
            {createTaskLink}
          </div>
        </nav>
        <div className={styles['sidebar-bottom']}>
          <div className={styles['sidebar-note']}>
            <Icon name="leaf" size={25} />
            <p>
              A little more focus.
              <br />A little less on your mind.
            </p>
          </div>
          <div className={styles['local-storage-note']}>
            <Icon name="shield" size={16} />
            <span>Yours, on this device.</span>
          </div>
          <p className={styles['storage-explanation']}>
            Tasks are saved in this browser. Clearing browser data removes them.
          </p>
        </div>
      </aside>
      <div className={styles['main-area']}>
        <header className={styles['workspace-header']}>
          <span>Personal workspace</span>
          <span className={styles['workspace-label-private']}>
            <span /> Private & local
          </span>
        </header>
        {persistenceWarning && (
          <div className={styles['persistence-warning']} role="alert">
            {persistenceWarning}
          </div>
        )}
        <main
          id="main-content"
          className={styles['page-content']}
          tabIndex={-1}
        >
          {children}
        </main>
        <footer className={styles['workspace-footer']}>
          A clear space for what comes next.
        </footer>
      </div>
    </div>
  )
}
