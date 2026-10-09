import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }
import presentationImports from './rules/presentation-imports.js'
import serviceImports from './rules/service-imports.js'
import { createStructureConfig } from './structure.js'
import type { StructureConfigOptions } from './structure.js'

export type LrsConfigOptions = StructureConfigOptions

export interface LrsPlugin extends ESLint.Plugin {
  rules: {
    'presentation-imports': Rule.RuleModule
    'service-imports': Rule.RuleModule
  }
  configs: {
    recommended: Linter.Config[]
  }
}

const plugin: LrsPlugin = {
  meta: {
    name: packageJson.name,
    namespace: 'lrs',
    version: packageJson.version,
  },
  rules: {
    // TypeScript visitors extend ESTree; ESLint's runtime accepts these rules.
    'presentation-imports': presentationImports as unknown as Rule.RuleModule,
    'service-imports': serviceImports as unknown as Rule.RuleModule,
  },
  configs: {
    recommended: [],
  },
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
export function createLrsConfig({ root }: LrsConfigOptions): Linter.Config[] {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root }),
  ]
}
