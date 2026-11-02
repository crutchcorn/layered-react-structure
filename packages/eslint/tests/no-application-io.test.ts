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

tester.run('no-application-io', plugin.rules['no-application-io'], {
  valid: [
    'export function normalize(value: string) { return value.trim(); }',
    'export function useDisclosure() { return { open: false }; }',
    'export function Display() { return <button onClick={() => undefined} />; }',
    'export function request() { return fetcher.get("/users"); }',
    'function readStorage(sessionStorage: { getItem(key: string): string }) { return sessionStorage.getItem("key"); }',
  ],
  invalid: [
    {
      code: "fetch('/users');",
      errors: [{ messageId: 'effect' }],
    },
    {
      code: "window.fetch('/users');",
      errors: [{ messageId: 'effect' }],
    },
    {
      code: "new WebSocket('wss://example.test');",
      errors: [{ messageId: 'effect' }],
    },
    {
      code: 'new XMLHttpRequest();',
      errors: [{ messageId: 'effect' }],
    },
    {
      code: "new EventSource('/events');",
      errors: [{ messageId: 'effect' }],
    },
    {
      code: 'window.localStorage.getItem("key");',
      errors: [{ messageId: 'effect' }],
    },
    {
      code: 'sessionStorage.setItem("key", "value");',
      errors: [{ messageId: 'effect' }],
    },
    {
      code: 'window.indexedDB.open("app");',
      errors: [{ messageId: 'effect' }],
    },
  ],
})

for (const filename of [
  'src/search.ui.tsx',
  'src/components/search-box.tsx',
  'src/views/search/components/search-box.tsx',
  'src/utils/search.ts',
]) {
  test(`recommended no-application-io rule applies to ${filename}`, () => {
    const messages = new Linter().verify(
      "fetch('/users');",
      [
        {
          files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
          languageOptions,
        },
        ...plugin.configs.recommended,
      ],
      { filename },
    )
    expect(messages.map((message) => message.ruleId)).toContain(
      'lrs/no-application-io',
    )
  })
}

test('recommended no-application-io leaves views and services available for effects', () => {
  const messages = new Linter().verify(
    "fetch('/users');",
    [
      {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        languageOptions,
      },
      ...plugin.configs.recommended,
    ],
    { filename: 'src/views/search/search.view.tsx' },
  )
  expect(messages).toEqual([])
})
