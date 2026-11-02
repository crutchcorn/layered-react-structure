import { Linter, RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import plugin from 'lrs-eslint-plugin'
import { describe, expect, it, test } from 'vitest'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const languageOptions: Linter.LanguageOptions = {
  parser: tseslint.parser,
  ecmaVersion: 'latest',
  sourceType: 'module',
  parserOptions: { ecmaFeatures: { jsx: true } },
}
const tester = new RuleTester({ languageOptions })

tester.run('component-placement', plugin.rules['component-placement'], {
  valid: [
    'export function Button() { return <button />; }',
    'export const Button = () => React.createElement("button");',
    "import { Button } from './button'; export { Button };",
    "export * from './button';",
  ],
  invalid: [
    {
      code: 'export function Button() { return null; }',
      errors: [{ messageId: 'render' }],
    },
    {
      code: 'export function useButtonState() { return 1; }',
      errors: [{ messageId: 'render' }, { messageId: 'hook' }],
    },
    {
      code: 'export const useButtonState = () => 1;',
      errors: [{ messageId: 'render' }, { messageId: 'hook' }],
    },
  ],
})

test('strict config checks components but recommended config does not enable this rule', () => {
  const linter = new Linter()
  const source = 'export const helper = () => 1;'
  const baseConfig: Linter.Config = {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    languageOptions,
  }
  const strictMessages = linter.verify(
    source,
    [baseConfig, ...plugin.configs.strict],
    { filename: 'src/views/search/components/helper.ts' },
  )
  expect(strictMessages.map((message) => message.ruleId)).toEqual([
    'lrs/component-placement',
  ])

  const recommendedMessages = linter.verify(
    source,
    [baseConfig, ...plugin.configs.recommended],
    { filename: 'src/views/search/components/helper.ts' },
  )
  expect(recommendedMessages).toEqual([])
})
