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
  },
})

tester.run('utility-imports', plugin.rules['utility-imports'], {
  valid: [
    "import { formatTime } from '../utils/format-time';",
    "import { QueryClient } from '@tanstack/query-core';",
    "import type { ReactNode } from 'react';",
    "import { type ReactNode } from 'react';",
    "import type { QueryClient } from '@tanstack/react-query';",
    "export type { ReactNode } from 'react';",
    "export type * from 'react';",
    "export type * as React from 'react';",
    "type ReactNode = import('react').ReactNode;",
    'const dependency = import(packageName);',
    'function inspect(require) { return require("react"); }',
  ],
  invalid: [
    {
      code: "import { useData } from '../hooks/use-data';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import type { Data } from '../services/data';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "export { View } from '../views/search/search.view';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { Button } from '../components/button';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { View } from '../search.view';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { UI } from '../search.ui.tsx';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { logic } from '../search.logic.ts';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { useState } from 'react';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { createRoot } from 'react-dom/client';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { useQuery } from '@tanstack/react-query';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "import { type ReactNode, useState } from 'react';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "export * from 'react';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "export * as React from 'react';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
    {
      code: "export type * from '../services/data';",
      errors: [{ messageId: 'forbiddenImport' }],
    },
  ],
})
