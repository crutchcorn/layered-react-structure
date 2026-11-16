import { eslintCompatPlugin } from '@oxlint/plugins'
import type { Plugin } from '@oxlint/plugins'
import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }
import { recommended, strict } from '../../oxlint/src/presets.js'
import type { RuleScope } from '../../oxlint/src/presets.js'
import { rules } from '../../oxlint/src/rules.js'
import { createStructureConfig } from './structure.js'
import type { StructureConfigOptions } from '../../oxlint/src/config-options.js'

export type LrsConfigOptions = StructureConfigOptions

export interface LrsPlugin extends ESLint.Plugin {
  rules: {
    'feature-imports': Rule.RuleModule
    'hook-rendering': Rule.RuleModule
    'no-application-io': Rule.RuleModule
    'component-placement': Rule.RuleModule
    'one-logic-per-folder': Rule.RuleModule
    'one-view-per-folder': Rule.RuleModule
    'presentation-imports': Rule.RuleModule
    'service-imports': Rule.RuleModule
    'utility-imports': Rule.RuleModule
    'view-composition': Rule.RuleModule
  }
  configs: {
    recommended: Linter.Config[]
    strict: Linter.Config[]
  }
}

// The shared visitors use typescript-eslint's AST and context types.
const plugin = eslintCompatPlugin({
  meta: {
    name: packageJson.name,
    namespace: 'lrs',
    version: packageJson.version,
  },
  rules,
  configs: {
    recommended: [],
    strict: [],
  },
} as unknown as Plugin) as unknown as LrsPlugin

function createPreset(scopes: RuleScope[]): Linter.Config[] {
  return scopes.map(({ rule, files, ...scope }) => ({
    ...scope,
    name: `lrs/${rule}`,
    files,
    plugins: { lrs: plugin },
    rules: { [`lrs/${rule}`]: 'error' },
  }))
}

plugin.configs.recommended = createPreset(recommended)
plugin.configs.strict = createPreset(strict)

export default plugin

/** Apply layer boundaries and the file layout to one React application. */
export function createLrsConfig({
  root,
  ignorePatterns,
}: LrsConfigOptions): Linter.Config[] {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root, ignorePatterns }),
  ]
}
