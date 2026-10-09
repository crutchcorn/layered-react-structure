import assert from 'node:assert/strict'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { createLrsConfig } from '../src/index.js'

const structureRule = 'project-structure/folder-structure'

function createFixture(context, { outsideCwd = false, additionalConfig } = {}) {
  // The upstream plugin writes a diagnostic cache, so each test owns its root.
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-structure-'))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
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
    async lint(filename, code = '') {
      const [result] = await eslint.lintText(code, {
        filePath: path.join(root, filename),
      })
      assert.ok(result, 'The candidate file must be selected for linting')
      return result
    },
    write(filename, contents) {
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
    assert.deepEqual(result.messages, [])
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
    assert.equal(result.messages.length, 1)
    assert.equal(result.messages[0].ruleId, structureRule)
    assert.equal(result.messages[0].severity, 2)
  })
}

test('absolute project root works when ESLint runs from its parent directory', async (context) => {
  const fixture = createFixture(context, { outsideCwd: true })
  assert.deepEqual(
    (await fixture.lint('src/views/search-results/search-results.view.tsx'))
      .messages,
    [],
  )
  const invalid = await fixture.lint('src/views/search-results/data/results.ts')
  assert.equal(invalid.messages[0]?.ruleId, structureRule)
})

test('separate ESLint instances report every file in the same invalid folder', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/data/first.ts', 'export const first = 1')
  const second = fixture.write('src/data/second.ts', 'export const second = 2')
  const [firstResult] = await fixture.eslint.lintFiles([first])
  assert.deepEqual(
    firstResult.messages.map((message) => message.ruleId),
    [structureRule],
  )
  const projectCache = path.join(fixture.root, 'projectStructure.cache.json')
  assert.equal(existsSync(projectCache), false)

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
  assert.deepEqual(
    secondResult.messages.map((message) => message.ruleId),
    [structureRule],
  )
  assert.equal(existsSync(projectCache), false)
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
  assert.equal(results.length, expected.size)
  for (const result of results) {
    const filename = path
      .relative(fixture.root, result.filePath)
      .replaceAll(path.sep, '/')
    assert.ok(expected.has(filename), `Unexpected lint result: ${filename}`)
    assert.deepEqual(
      result.messages.map((message) => message.ruleId),
      expected.get(filename) ? [structureRule] : [],
      filename,
    )
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
    assert.deepEqual(result.messages.map((message) => message.ruleId).sort(), [
      'lrs/presentation-imports',
      'no-console',
      structureRule,
    ])

    const service = await fixture.lint(
      'src/views/search-results/services/search.ts',
      "import React from 'react';",
    )
    assert.deepEqual(
      service.messages.map((message) => message.ruleId),
      ['lrs/service-imports'],
    )
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
    assert.ok(result)
    assert.deepEqual(result.messages, [])
  }
})

test('structure factory requires an explicit absolute project directory', () => {
  for (const root of ['.', 'apps/frontend', '', undefined]) {
    assert.throws(() => createLrsConfig({ root }), /absolute project directory/)
  }
})
