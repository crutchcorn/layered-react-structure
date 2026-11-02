import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import plugin from 'lrs-eslint-plugin'
import { describe, it } from 'vitest'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('view-composition', plugin.rules['view-composition'], {
  valid: [
    'export function View() { return <PageUI title="People" /> }',
    'export function View() { return <PageUI /> }',
  ],
  invalid: [
    {
      code: 'export function View() { return <main /> }',
      errors: [{ messageId: 'element' }],
    },
    {
      code: 'export function View() { return <PageUI className="wide" /> }',
      errors: [{ messageId: 'styling' }],
    },
    {
      code: 'export function View() { return <PageUI style={{ color: "red" }} /> }',
      errors: [{ messageId: 'styling' }],
    },
  ],
})
