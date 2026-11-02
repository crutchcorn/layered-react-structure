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

tester.run('hook-rendering', plugin.rules['hook-rendering'], {
  valid: [
    "import { useState } from 'react'; export function useCounter() { return useState(0); }",
    "import * as React from 'react'; export function useCounter() { return React.useState(0); }",
    'export function useCounter() { return 1; }',
  ],
  invalid: [
    {
      code: 'export function useCounter() { return <div />; }',
      errors: [{ messageId: 'render' }],
    },
    {
      code: 'export function useCounter() { return <></>; }',
      errors: [{ messageId: 'render' }],
    },
    {
      code: "import { createElement as h } from 'react'; export const useCounter = () => h('div');",
      errors: [{ messageId: 'render' }],
    },
    {
      code: "import * as React from 'react'; export const useCounter = () => React.createElement('div');",
      errors: [{ messageId: 'render' }],
    },
    {
      code: "import React from 'react'; export const useCounter = () => React.createElement('div');",
      errors: [{ messageId: 'render' }],
    },
  ],
})
