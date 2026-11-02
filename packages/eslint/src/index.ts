import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }
import featureImports from './rules/feature-imports.js'
import hookRendering from './rules/hook-rendering.js'
import oneLogicPerFolder from './rules/one-logic-per-folder.js'
import oneViewPerFolder from './rules/one-view-per-folder.js'
import presentationImports from './rules/presentation-imports.js'
import serviceImports from './rules/service-imports.js'
import utilityImports from './rules/utility-imports.js'
import viewComposition from './rules/view-composition.js'
import { createStructureConfig } from './structure.js'
import type { StructureConfigOptions } from './structure.js'

export type LrsConfigOptions = StructureConfigOptions

export interface LrsPlugin extends ESLint.Plugin {
  rules: {
    'feature-imports': Rule.RuleModule
    'hook-rendering': Rule.RuleModule
    'one-logic-per-folder': Rule.RuleModule
    'one-view-per-folder': Rule.RuleModule
    'presentation-imports': Rule.RuleModule
    'service-imports': Rule.RuleModule
    'utility-imports': Rule.RuleModule
    'view-composition': Rule.RuleModule
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
    'one-logic-per-folder': oneLogicPerFolder,
    'one-view-per-folder': oneViewPerFolder,
    'hook-rendering': hookRendering as unknown as Rule.RuleModule,
    // TypeScript visitors extend ESTree; ESLint's runtime accepts these rules.
    'feature-imports': featureImports as unknown as Rule.RuleModule,
    'presentation-imports': presentationImports as unknown as Rule.RuleModule,
    'service-imports': serviceImports as unknown as Rule.RuleModule,
    'utility-imports': utilityImports as unknown as Rule.RuleModule,
    'view-composition': viewComposition as unknown as Rule.RuleModule,
  },
  configs: {
    recommended: [],
  },
}

plugin.configs.recommended = [
  {
    name: 'lrs/feature-imports',
    files: ['src/**/views/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/feature-imports': 'error' },
  },
  {
    name: 'lrs/hook-rendering',
    files: ['src/**/hooks/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/hook-rendering': 'error' },
  },
  {
    name: 'lrs/one-logic-per-folder',
    files: ['src/**/*.logic.ts'],
    plugins: { lrs: plugin },
    rules: { 'lrs/one-logic-per-folder': 'error' },
  },
  {
    name: 'lrs/one-view-per-folder',
    files: ['src/**/*.view.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/one-view-per-folder': 'error' },
  },
  {
    name: 'lrs/presentation-imports',
    files: [
      'src/**/*.ui.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
      'src/**/components/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
    ],
    plugins: { lrs: plugin },
    rules: { 'lrs/presentation-imports': 'error' },
  },
  {
    name: 'lrs/view-composition',
    files: ['src/**/*.view.tsx'],
    plugins: { lrs: plugin },
    rules: { 'lrs/view-composition': 'error' },
  },
  {
    name: 'lrs/service-imports',
    files: ['src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/service-imports': 'error' },
  },
  {
    name: 'lrs/utility-imports',
    files: ['src/**/utils/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    plugins: { lrs: plugin },
    rules: { 'lrs/utility-imports': 'error' },
  },
]

export default plugin

/** Apply layer boundaries and the file layout to one React application. */
export function createLrsConfig({ root }: LrsConfigOptions): Linter.Config[] {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root }),
  ]
}
