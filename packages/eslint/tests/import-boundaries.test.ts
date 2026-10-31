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

const chatView = 'src/views/chat/chat.view.tsx'

function invalidIn(
  filename: string,
  code: string,
  source: string,
): RuleTester.InvalidTestCase {
  return { ...invalid(code, source), filename }
}

tester.run('feature-imports', plugin.rules['feature-imports'], {
  valid: [
    {
      filename: chatView,
      code: "import { useChat } from './hooks/use-chat'; import { ChatUI } from './chat.ui'; import styles from './chat.module.css';",
    },
    {
      filename: chatView,
      code: "import { useAuth } from '../../hooks/use-auth'; import { Button } from '../../components/button'; import { request } from '../../services/http';",
    },
    {
      filename: 'src/views/chat/components/message.tsx',
      code: "import type { Message } from '../../../types/chat'; import { formatTime } from '../../../utils/time';",
    },
    {
      filename: chatView,
      code: "import { useAuth } from '@/hooks/use-auth'; import { ChatUI } from '@/views/chat/chat.ui'; import { usePeople } from '#app/views/chat/hooks/use-people';",
    },
    {
      filename: chatView,
      code: "import { useState } from 'react'; import { useQuery } from '@tanstack/react-query'; import { icons } from 'react-views/icons';",
    },
    {
      filename: chatView,
      code: "import { usePeople } from '../../views/chat/hooks/use-people';",
    },
    {
      filename: 'src/views/chat/views/thread/thread.view.tsx',
      code: "import { useChat } from '../../hooks/use-chat'; import { ChatUI } from '../../chat.ui';",
    },
    {
      filename: chatView,
      code: "import { ThreadView } from './views/thread/thread.view';",
    },
    {
      filename: chatView,
      code: "const people = import('../people/' + name); const view = require(moduleName);",
    },
    {
      filename: 'C:\\project\\src\\views\\chat\\chat.view.tsx',
      code: "import { ChatUI } from './chat.ui'; import { useAuth } from '../../hooks/use-auth';",
    },
    // Shared layers importing a feature are outside this rule's scope.
    {
      filename: 'src/components/person-card.tsx',
      code: "import { PeopleUI } from '../views/people/people.ui';",
    },
    {
      filename: 'src/views/index.ts',
      code: "export { ChatView } from './chat/chat.view'; export { PeopleView } from './people/people.view';",
    },
  ],
  invalid: [
    invalidIn(
      chatView,
      "import { usePeople } from '../people/hooks/use-people';",
      '../people/hooks/use-people',
    ),
    invalidIn(
      'src/views/chat/chat.ui.tsx',
      "import { PersonCard } from '../people/components/person-card';",
      '../people/components/person-card',
    ),
    invalidIn(
      chatView,
      "import { PeopleView } from '../people/people.view';",
      '../people/people.view',
    ),
    invalidIn(chatView, "import { people } from '../people';", '../people'),
    invalidIn(
      'src/views/chat/components/message.tsx',
      "import { formatName } from '../../people/utils/format-name';",
      '../../people/utils/format-name',
    ),
    invalidIn(
      'src/views/chat/hooks/use-chat.ts',
      "import { usePeople } from '../../people/hooks/use-people';",
      '../../people/hooks/use-people',
    ),
    invalidIn(
      chatView,
      "import { usePeople } from '../../views/people/hooks/use-people';",
      '../../views/people/hooks/use-people',
    ),
    invalidIn(
      chatView,
      "import { usePeople } from '@/views/people/hooks/use-people';",
      '@/views/people/hooks/use-people',
    ),
    invalidIn(
      chatView,
      "import { usePeople } from '#app/views/people/hooks/use-people';",
      '#app/views/people/hooks/use-people',
    ),
    invalidIn(
      chatView,
      "import styles from '../people/people.module.css';",
      '../people/people.module.css',
    ),
    invalidIn(
      chatView,
      "import type { Person } from '../people/types/person';",
      '../people/types/person',
    ),
    invalidIn(
      chatView,
      "export * from '../people/hooks/use-people';",
      '../people/hooks/use-people',
    ),
    invalidIn(
      chatView,
      "export { PeopleView } from '../people/people.view.tsx';",
      '../people/people.view.tsx',
    ),
    invalidIn(
      chatView,
      "const people = import('../people/people.view');",
      '../people/people.view',
    ),
    invalidIn(
      chatView,
      "const people = require('../people/people.view');",
      '../people/people.view',
    ),
    invalidIn(
      chatView,
      "type Person = import('../people/types/person').Person;",
      '../people/types/person',
    ),
    invalidIn(
      chatView,
      "import view from '../people/people.view.tsx?raw';",
      '../people/people.view.tsx?raw',
    ),
    invalidIn(
      'src/views/chat/views/thread/thread.view.tsx',
      "import { useSearch } from '../search/hooks/use-search';",
      '../search/hooks/use-search',
    ),
    invalidIn(
      'C:\\project\\src\\views\\chat\\chat.view.tsx',
      String.raw`import { PeopleView } from '..\\people\\people.view';`,
      String.raw`..\people\people.view`,
    ),
  ],
})

const baseConfig: Linter.Config = {
  files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
  languageOptions,
}

test('JavaScript consumers can use the default ESLint parser', () => {
  const messages = new Linter().verify(
    "import React from 'react'; const service = import('../../services/client'); export const View = () => <div />;",
    [
      { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
      ...plugin.configs.recommended,
    ],
    { filename: 'src/views/chat/chat.ui.jsx' },
  )
  expect(messages).toHaveLength(1)
  expect(messages[0]?.ruleId).toBe('lrs/presentation-imports')
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
    "import secret from 'app-forbidden'; import service from '../../services/chat';",
    config,
    { filename: 'src/views/chat/chat.ui.tsx' },
  )
  expect(messages.map((message) => message.ruleId).sort()).toEqual([
    'lrs/presentation-imports',
    'no-restricted-imports',
  ])
  for (const entry of plugin.configs.recommended) {
    expect(entry.rules).toBeDefined()
    expect(entry.rules).not.toHaveProperty('no-restricted-imports')
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
    expect(messages).toHaveLength(1)
    expect(messages[0]?.ruleId).toBe('lrs/presentation-imports')
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
      expect(messages).toHaveLength(1)
      expect(messages[0]?.ruleId).toBe('lrs/service-imports')
    })
  }
}

for (const filename of [
  'src/views/chat/chat.view.tsx',
  'src/views/chat/chat.ui.jsx',
  'src/views/chat/hooks/use-chat.ts',
  'src/views/chat/components/message.tsx',
]) {
  test(`recommended feature rule applies to ${filename}`, () => {
    const messages = new Linter().verify(
      "import { PeopleUI } from '@/views/people/people.ui';",
      [baseConfig, ...plugin.configs.recommended],
      { filename },
    )
    expect(messages).toHaveLength(1)
    expect(messages[0]?.ruleId).toBe('lrs/feature-imports')
  })
}

for (const filename of [
  'src/hooks/use-chat.ts',
  'src/views/chat/chat.view.tsx',
  'test-fixtures/chat.ui.tsx',
]) {
  test(`recommended boundaries report nothing for ${filename}`, () => {
    const messages = new Linter().verify(
      "import { useQuery } from '@tanstack/react-query'; import { request } from '@/services/http';",
      [baseConfig, ...plugin.configs.recommended],
      { filename },
    )
    expect(messages).toEqual([])
  })
}
