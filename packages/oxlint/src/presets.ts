import type { rules } from './rules.js'

const testFileIgnores = ['**/*.{test,spec,stories}.*', '**/*-test-support.*']

export interface RuleScope {
  rule: keyof typeof rules
  files: string[]
  ignores?: string[]
}

export const recommended = [
  {
    rule: 'feature-imports',
    files: ['src/**/views/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    ignores: testFileIgnores,
  },
  {
    rule: 'hook-rendering',
    files: ['src/**/hooks/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    ignores: testFileIgnores,
  },
  {
    rule: 'one-logic-per-folder',
    files: ['src/**/*.logic.ts'],
  },
  {
    rule: 'one-view-per-folder',
    files: ['src/**/*.view.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
  },
  {
    rule: 'no-application-io',
    files: [
      'src/**/*.ui.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
      'src/**/components/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
      'src/**/utils/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
    ],
    ignores: testFileIgnores,
  },
  {
    rule: 'presentation-imports',
    files: [
      'src/**/*.ui.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
      'src/**/components/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',
    ],
    ignores: testFileIgnores,
  },
  {
    rule: 'view-composition',
    files: ['src/**/*.view.tsx'],
    ignores: testFileIgnores,
  },
  {
    rule: 'service-imports',
    files: ['src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    ignores: testFileIgnores,
  },
  {
    rule: 'utility-imports',
    files: ['src/**/utils/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    ignores: testFileIgnores,
  },
] satisfies RuleScope[]

export const strict = [
  {
    rule: 'component-placement',
    files: ['src/**/components/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    ignores: testFileIgnores,
  },
] satisfies RuleScope[]
