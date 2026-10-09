import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import { getRouter } from './router'
import { createTodoRuntime } from './services/todo-runtime'
import './styles.module.css'

const runtime = createTodoRuntime()
const router = getRouter()
const rootElement = document.getElementById('app')!

createRoot(rootElement).render(
  <StrictMode>
    <App runtime={runtime} router={router} />
  </StrictMode>,
)
