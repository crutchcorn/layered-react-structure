import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint } from 'eslint'
import type { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'
import { createLrsConfig } from 'lrs-eslint-plugin'

const structureRule = 'project-structure/folder-structure'

interface FixtureOptions {
  outsideCwd?: boolean
  additionalConfig?: (root: string) => Linter.Config[]
}

function createFixture(
  context: TestContext,
  { outsideCwd = false, additionalConfig }: FixtureOptions = {},
) {
  // The upstream plugin writes a diagnostic cache, so each test owns its root.
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-structure-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )
  const root = path.join(directory, 'frontend')
  mkdirSync(root)
  const eslint = new ESLint({
    cwd: outsideCwd ? directory : root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        languageOptions: { parser: tseslint.parser },
      },
      ...(additionalConfig?.(root) ?? []),
      ...createLrsConfig({ root }),
    ],
  })

  return {
    directory,
    root,
    eslint,
    async lint(filename: string, code = '') {
      const [result] = await eslint.lintText(code, {
        filePath: path.join(root, filename),
      })
      expect.assert(result, 'The candidate file must be selected for linting')
      return result
    },
    write(filename: string, contents: string) {
      const target = path.join(root, filename)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, contents)
      return target
    },
  }
}

for (const filename of [
  'src/app.tsx',
  'src/main.tsx',
  'src/vite-env.d.ts',
  'src/app.spec.tsx',
  'src/components/status-pill.tsx',
  'src/components/buttons/action-button.ui.tsx',
  'src/components/buttons/action-button.ui.spec.tsx',
  'src/components/buttons/action-button.stories.tsx',
  'src/components/buttons/action-button.module.css',
  'src/constants/network/timeouts.ts',
  'src/hooks/use-status.ts',
  'src/hooks/network/use-connectivity.spec.tsx',
  'src/hooks/network/index.ts',
  'src/services/offline/outbox-storage.ts',
  'src/services/offline/outbox-storage.spec.ts',
  'src/services/schemas/new-api.d.ts',
  'src/types/chat-api.ts',
  'src/types/svg.d.ts',
  'src/types/browser/preferences.d.ts',
  'src/utils/errors/error-message.ts',
  'src/utils/testing-utils/render-container.tsx',
  'src/assets/icons/arrow-left.svg',
  'src/views/account-settings/account-settings.view.tsx',
  'src/views/account-settings/empty-state.ui.tsx',
  'src/views/account-settings/account-settings.view.test.tsx',
  'src/views/account-settings/account-settings.view.stories.tsx',
  'src/views/account-settings/empty-state.ui.stories.tsx',
  'src/views/account-settings/account-settings.module.css',
  'src/views/account-settings/index.ts',
  'src/views/account-settings/services/preferences.ts',
  'src/views/account-settings/services/schemas/preferences.d.ts',
  'src/views/account-settings/hooks/use-preferences.ts',
  'src/views/account-settings/utils/form/validation.ts',
  'src/views/account-settings/constants/timeouts.ts',
  'src/views/account-settings/types/preferences.d.ts',
  'src/views/account-settings/components/save-button.tsx',
]) {
  test(`structure accepts ${filename}`, async (context) => {
    const result = await createFixture(context).lint(filename)
    expect(result.messages).toEqual([])
  })
}

for (const filename of [
  'src/data/chat.ts',
  'src/data/projectStructure.cache.json',
  'src/services/projectStructure.cache.json/service.ts',
  'src/chat.ts',
  'src/helpers/format.ts',
  'src/views/AccountSettings/account-settings.view.tsx',
  'src/views/account_settings/account-settings.view.tsx',
  'src/views/account-settings/foo/helper.ts',
  'src/views/account-settings/data/preferences.ts',
  'src/views/account-settings/account-settings.tsx',
  'src/views/account-settings/account-settings.view.ts',
  'src/views/account-settings/empty-state.ui.jsx',
  'src/views/account-settings/services/preferences.tsx',
  'src/views/account-settings/services/preferences.jsx',
  'src/services/preferences.tsx',
  'src/services/preferences.jsx',
  'src/services/preferences.d.ts',
  'src/services/internal/schemas/preferences.d.ts',
  'src/utils/production-component.tsx',
  'src/utils/errors/ErrorMessage.ts',
  'src/utils/errors/error_message.ts',
  'src/hooks/connectivity.ts',
  'src/hooks/use-connectivity.tsx',
  'src/components/SaveButton.tsx',
  'src/components/forms/save_button.tsx',
  'src/assets/Icons/arrow-left.svg',
  'src/assets/icons/ArrowLeft.svg',
  'src/assets/icons/arrow_left.svg',
  'src/assets/icons/arrow-left.SVG',
  'src/assets/icons/extensionless',
]) {
  test(`structure rejects ${filename}`, async (context) => {
    const result = await createFixture(context).lint(filename)
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0]).toMatchObject({
      ruleId: structureRule,
      severity: 2,
    })
  })
}

test('absolute project root works when ESLint runs from its parent directory', async (context) => {
  const fixture = createFixture(context, { outsideCwd: true })
  expect(
    (await fixture.lint('src/views/search-results/search-results.view.tsx'))
      .messages,
  ).toEqual([])
  const invalid = await fixture.lint('src/views/search-results/data/results.ts')
  expect(invalid.messages[0]?.ruleId).toBe(structureRule)
})

test('separate ESLint instances report every file in the same invalid folder', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/data/first.ts', 'export const first = 1')
  const second = fixture.write('src/data/second.ts', 'export const second = 2')
  const [firstResult] = await fixture.eslint.lintFiles([first])
  expect.assert(firstResult)
  expect(firstResult.messages.map((message) => message.ruleId)).toEqual([
    structureRule,
  ])
  const projectCache = path.join(fixture.root, 'projectStructure.cache.json')
  expect(existsSync(projectCache)).toBe(false)

  // A second invocation must not reuse the first file's folder diagnostic.
  // Both files exist so the upstream cache would retain the first entry.
  const nextESLint = new ESLint({
    cwd: fixture.root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tseslint.parser },
      },
      ...createLrsConfig({ root: fixture.root }),
    ],
  })
  const [secondResult] = await nextESLint.lintFiles([second])
  expect.assert(secondResult)
  expect(secondResult.messages.map((message) => message.ruleId)).toEqual([
    structureRule,
  ])
  expect(existsSync(projectCache)).toBe(false)
})

test('filesystem lint includes CSS, SVG, unknown extensions, and extensionless files', async (context) => {
  const fixture = createFixture(context)
  const expected = new Map([
    ['src/views/search-results/search-results.module.css', false],
    ['src/assets/icons/arrow-left.svg', false],
    ['src/assets/icons/ArrowRight.svg', true],
    ['src/views/search-results/SearchResults.css', true],
    ['src/assets/icons/arrow-left.unknown', true],
    ['src/assets/icons/extensionless', true],
  ])
  for (const filename of expected.keys()) {
    fixture.write(
      filename,
      filename.endsWith('.css') ? '.result { color: red; }' : '<svg />',
    )
  }

  const results = await fixture.eslint.lintFiles(['src'])
  expect(results).toHaveLength(expected.size)
  for (const result of results) {
    const filename = path
      .relative(fixture.root, result.filePath)
      .replaceAll(path.sep, '/')
    expect(expected.has(filename), `Unexpected lint result: ${filename}`).toBe(
      true,
    )
    expect(
      result.messages.map((message) => message.ruleId),
      filename,
    ).toEqual(expected.get(filename) ? [structureRule] : [])
  }
})

for (const outsideCwd of [false, true]) {
  test(`combined config checks imports and paths from ${outsideCwd ? 'parent' : 'app'} cwd`, async (context) => {
    const fixture = createFixture(context, {
      outsideCwd,
      additionalConfig: () => [
        { files: ['**/*.{ts,tsx}'], rules: { 'no-console': 'error' } },
      ],
    })
    const code = `
    import { request } from '../services/client';
    const count: number = 1;
    export function Results() {
      console.log(request, count);
      return <button>{count}</button>;
    }
  `
    const result = await fixture.lint(
      'src/views/search-results/Results.ui.tsx',
      code,
    )
    expect(result.messages.map((message) => message.ruleId).sort()).toEqual([
      'lrs/presentation-imports',
      'no-console',
      structureRule,
    ])

    const service = await fixture.lint(
      'src/views/search-results/services/search.ts',
      "import React from 'react';",
    )
    expect(service.messages.map((message) => message.ruleId)).toEqual([
      'lrs/service-imports',
    ])
  })
}

test('frontend path policy leaves sibling backend and framework files alone', async (context) => {
  const fixture = createFixture(context, { outsideCwd: true })
  for (const filename of [
    path.join(fixture.directory, 'backend/src/data/ServerHandler.ts'),
    path.join(fixture.root, 'vite.config.ts'),
    path.join(fixture.root, 'e2e/chat.spec.ts'),
  ]) {
    const [result] = await fixture.eslint.lintText(
      'export const value: number = 1',
      {
        filePath: filename,
      },
    )
    expect.assert(result)
    expect(result.messages).toEqual([])
  }
})

test('structure factory requires an explicit absolute project directory', () => {
  for (const root of ['.', 'apps/frontend', '']) {
    expect(() => createLrsConfig({ root })).toThrow(
      /absolute project directory/,
    )
  }
  expect(
    // @ts-expect-error JavaScript callers can omit the required root value.
    () => createLrsConfig({ root: undefined }),
  ).toThrow(/absolute project directory/)
})
