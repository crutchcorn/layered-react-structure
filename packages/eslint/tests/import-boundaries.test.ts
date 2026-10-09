import assert from 'node:assert/strict'
import { Linter, RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import plugin from 'lrs-eslint-plugin'
import { describe, it, test } from 'vitest'

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

function invalid(code: string, source: string): RuleTester.InvalidTestCase {
  return {
    code,
    errors: [{ messageId: 'forbiddenImport', data: { source } }],
  }
}

const sourceExtensions = ['ts', 'tsx', 'js', 'jsx', 'mts', 'cts', 'mjs', 'cjs']

tester.run('presentation-imports', plugin.rules['presentation-imports'], {
  valid: [
    {
      filename: 'src/counter.ui.tsx',
      code: "import { useState } from 'react'; export function Counter() { const [count, setCount] = useState(0); return <button onClick={() => setCount(count + 1)}>{count}</button>; }",
    },
    "import { useState } from 'react'; import type { ReactNode } from 'react';",
    "import { createPortal } from 'react-dom'; import { jsx } from 'react/jsx-runtime';",
    "import type { Message } from '../types/chat'; import { formatTime } from '../utils/time';",
    "import { channels } from '../constants/chat'; import { Button } from './button.ui.tsx';",
    "export type { Message } from '../types/chat'; export * from './button.ui';",
    "import viewModel from '../utils/view-model'; import worker from '../service-worker';",
    "import { useSomething } from './hooks-helper'; import view from './chat.view-model';",
    "const client = import('../services/' + name);",
    'const client = import(`../services/${name}`);',
    'const client = require(moduleName);',
    "function inspect(require) { return require('../services/chat'); }",
    "const require = (path) => path; require('../services/chat');",
    "import { require } from './utils/test'; require('../services/chat');",
    {
      filename: 'C:\\project\\src\\views\\chat\\chat.ui.tsx',
      code: "import type { Message } from '../types/chat';",
    },
  ],
  invalid: [
    invalid("import { send } from '../services/chat';", '../services/chat'),
    invalid("import client from '@/services/chat';", '@/services/chat'),
    invalid("import client from '#app/services/chat';", '#app/services/chat'),
    invalid("import client from '../services';", '../services'),
    invalid(
      "import { useChat } from '../hooks/use-chat';",
      '../hooks/use-chat',
    ),
    invalid("import { useChat } from '../hooks';", '../hooks'),
    invalid("import { ChatView } from './chat.view';", './chat.view'),
    invalid(
      "import { QueryClient } from '@tanstack/query-core';",
      '@tanstack/query-core',
    ),
    invalid(
      "import type { QueryClient } from '@tanstack/react-query';",
      '@tanstack/react-query',
    ),
    invalid("import '@tanstack/router/devtools';", '@tanstack/router/devtools'),
    invalid(
      "import type { Chat } from '../services/chat';",
      '../services/chat',
    ),
    invalid("export { ChatView } from './chat.view.tsx';", './chat.view.tsx'),
    invalid(
      "export type { Chat } from '../services/chat';",
      '../services/chat',
    ),
    invalid("export * from '../hooks/use-chat';", '../hooks/use-chat'),
    invalid("export * as chat from '../services/chat';", '../services/chat'),
    invalid("const client = import('../services/chat');", '../services/chat'),
    invalid('const client = import(`../services/chat`);', '../services/chat'),
    invalid("const client = require('../services/chat');", '../services/chat'),
    invalid('const client = require(`../services/chat`);', '../services/chat'),
    invalid(
      "const client = require?.('../services/chat');",
      '../services/chat',
    ),
    invalid("type Chat = import('../services/chat').Chat;", '../services/chat'),
    invalid("import Chat = require('../services/chat');", '../services/chat'),
    invalid("import view from './chat.view.tsx?raw';", './chat.view.tsx?raw'),
    invalid(
      "import view from './chat.view.tsx#fragment';",
      './chat.view.tsx#fragment',
    ),
    invalid(
      String.raw`import client from '..\\services\\chat';`,
      String.raw`..\services\chat`,
    ),
    ...sourceExtensions.map((extension) =>
      invalid(
        `import view from './chat.view.${extension}';`,
        `./chat.view.${extension}`,
      ),
    ),
  ],
})

tester.run('service-imports', plugin.rules['service-imports'], {
  valid: [
    "import { QueryClient } from '@tanstack/query-core';",
    "import { createCollection } from '@tanstack/db'; import { startOfflineExecutor } from '@tanstack/offline-transactions';",
    "import type { Chat } from '../types/chat'; import { normalize } from '../utils/chat';",
    "import { request } from '../services/http'; export * from './storage';",
    "import request from './react-compatible-http'; import { shape } from './chat.ui-model';",
    "export type { Chat } from '../types/chat';",
    "function inspect(require) { return require('react'); }",
    "{ const require = (path) => path; require('react'); }",
    'const library = import(packageName);',
    'const library = require(`react/${packageName}`);',
  ],
  invalid: [
    invalid("import { useState } from 'react';", 'react'),
    invalid("import type { ReactNode } from 'react';", 'react'),
    invalid("import { jsx } from 'react/jsx-runtime';", 'react/jsx-runtime'),
    invalid("import { createPortal } from 'react-dom';", 'react-dom'),
    invalid(
      "import { createRoot } from 'react-dom/client';",
      'react-dom/client',
    ),
    invalid(
      "import { renderToString } from 'react-dom/server';",
      'react-dom/server',
    ),
    invalid(
      "import { useQuery } from '@tanstack/react-query';",
      '@tanstack/react-query',
    ),
    invalid(
      "import { useLiveQuery } from '@tanstack/react-db';",
      '@tanstack/react-db',
    ),
    invalid(
      "import { Router } from '@tanstack/react-router/ssr';",
      '@tanstack/react-router/ssr',
    ),
    invalid(
      "import type { Chat } from '../hooks/use-chat';",
      '../hooks/use-chat',
    ),
    invalid("import { Chat } from '../chat.view';", '../chat.view'),
    invalid("import { Chat } from '../chat.ui';", '../chat.ui'),
    invalid("export * from 'react';", 'react'),
    invalid("export type { ReactNode } from 'react';", 'react'),
    invalid("export * as ui from '../chat.ui.tsx';", '../chat.ui.tsx'),
    invalid("const ui = import('../chat.ui.tsx');", '../chat.ui.tsx'),
    invalid("type View = import('../chat.view.tsx').View;", '../chat.view.tsx'),
    invalid("import React = require('react');", 'react'),
    invalid("const React = require('react');", 'react'),
    invalid('const React = import(`react`);', 'react'),
    invalid(
      String.raw`import ui from '..\\chat.ui.tsx';`,
      String.raw`..\chat.ui.tsx`,
    ),
    ...sourceExtensions.flatMap((extension) =>
      ['ui', 'view'].map((kind) =>
        invalid(
          `import component from '../chat.${kind}.${extension}';`,
          `../chat.${kind}.${extension}`,
        ),
      ),
    ),
  ],
})

const baseConfig: Linter.Config = {
  files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
  languageOptions,
}

test('JavaScript consumers can use the default ESLint parser', () => {
  const messages = new Linter().verify(
    "import React from 'react'; const service = import('../services/client'); export const View = () => <div />;",
    [
      { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
      ...plugin.configs.recommended,
    ],
    { filename: 'src/views/chat/chat.ui.jsx' },
  )
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.ruleId, 'lrs/presentation-imports')
})

test('recommended configuration scopes both layers without replacing application restrictions', () => {
  const linter = new Linter()
  const config: Linter.Config[] = [
    baseConfig,
    {
      rules: {
        'no-restricted-imports': ['error', { paths: ['app-forbidden'] }],
      },
    },
    ...plugin.configs.recommended,
  ]

  const messages = linter.verify(
    "import secret from 'app-forbidden'; import service from '../services/chat';",
    config,
    { filename: 'src/views/chat/chat.ui.tsx' },
  )
  assert.deepEqual(messages.map((message) => message.ruleId).sort(), [
    'lrs/presentation-imports',
    'no-restricted-imports',
  ])
  for (const entry of plugin.configs.recommended) {
    assert.ok(entry.rules)
    assert.equal(Object.hasOwn(entry.rules, 'no-restricted-imports'), false)
  }
})

for (const filename of [
  'src/chat.ui.tsx',
  'src/views/chat/chat.ui.tsx',
  'src/views/chat/chat.ui.jsx',
]) {
  test(`recommended presentation rule applies to ${filename}`, () => {
    const messages = new Linter().verify(
      "import query from '@tanstack/react-query';",
      [baseConfig, ...plugin.configs.recommended],
      { filename },
    )
    assert.equal(messages.length, 1)
    assert.equal(messages[0]?.ruleId, 'lrs/presentation-imports')
  })
}

for (const extension of sourceExtensions) {
  for (const directory of ['src/services', 'src/views/chat/services/nested']) {
    const filename = `${directory}/request.${extension}`
    test(`recommended service rule applies to ${filename}`, () => {
      const messages = new Linter().verify(
        "import React from 'react';",
        [baseConfig, ...plugin.configs.recommended],
        { filename },
      )
      assert.equal(messages.length, 1)
      assert.equal(messages[0]?.ruleId, 'lrs/service-imports')
    })
  }
}

for (const filename of [
  'src/hooks/use-chat.ts',
  'src/views/chat/chat.view.tsx',
  'test-fixtures/chat.ui.tsx',
]) {
  test(`recommended boundaries leave ${filename} outside their scope`, () => {
    const messages = new Linter().verify(
      "import { useQuery } from '@tanstack/react-query'; import { request } from '../services/http';",
      [baseConfig, ...plugin.configs.recommended],
      { filename },
    )
    assert.deepEqual(messages, [])
  })
}
