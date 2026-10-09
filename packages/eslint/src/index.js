import presentationImports from './rules/presentation-imports.js'
import serviceImports from './rules/service-imports.js'
import { createStructureConfig } from './structure.js'

const plugin = {
  meta: {
    name: '@demo-proj/lrs-eslint',
    namespace: 'lrs',
    version: '0.0.0',
  },
  rules: {
    'presentation-imports': presentationImports,
    'service-imports': serviceImports,
  },
  configs: {},
}

plugin.configs.recommended = [
  {
    name: 'lrs/presentation-imports',
    files: ['src/**/*.ui.{tsx,jsx}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/presentation-imports': 'error' },
  },
  {
    name: 'lrs/service-imports',
    files: ['src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/service-imports': 'error' },
  },
]

export default plugin

/** Apply import boundaries and the file layout to one React application. */
export function createLrsConfig({ root }) {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root }),
  ]
}
