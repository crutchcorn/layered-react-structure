import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint, Linter } from 'eslint'
import plugin, { createLrsConfig } from 'lrs-eslint-plugin'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'

const ruleId = 'lrs/one-logic-per-folder'
const duplicateLogic = expect.objectContaining({
  ruleId,
  messageId: 'multipleLogicFiles',
  severity: 2,
})

function createFixture(
  context: TestContext,
  { combined = false, manual = false } = {},
) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-one-logic-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )
  const root = path.join(directory, 'frontend')
  mkdirSync(root)
  const eslint = new ESLint({
    cwd: combined ? directory : root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser },
      },
      ...(manual
        ? [{ plugins: { lrs: plugin }, rules: { [ruleId]: 'error' as const } }]
        : combined
          ? createLrsConfig({ root })
          : plugin.configs.recommended),
    ],
  })

  return {
    root,
    eslint,
    write(filename: string) {
      const target = path.join(root, filename)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, 'export const value = 1')
      return target
    },
    async lintFile(filename: string) {
      const [result] = await eslint.lintFiles([filename])
      expect.assert(result, 'The file must be selected for linting')
      return result.messages
    },
  }
}

test('partial linting reports either logic file when its folder contains two', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/views/chat/chat.logic.ts')
  const second = fixture.write('src/views/chat/details.logic.ts')

  expect(await fixture.lintFile(first)).toEqual([duplicateLogic])
  expect(await fixture.lintFile(second)).toEqual([duplicateLogic])
})

test('an unsaved logic file counts alongside its existing sibling', async (context) => {
  const fixture = createFixture(context)
  fixture.write('src/views/chat/chat.logic.ts')

  const [result] = await fixture.eslint.lintText('export const value = 1', {
    filePath: path.join(fixture.root, 'src/views/chat/details.logic.ts'),
  })

  expect(result?.messages).toEqual([duplicateLogic])
})

test('one logic file and one view may coexist with tests and local hooks', async (context) => {
  const fixture = createFixture(context, { combined: true })
  fixture.write('src/views/chat/chat.logic.ts')
  fixture.write('src/views/chat/chat.view.tsx')
  fixture.write('src/views/chat/chat.ui.tsx')
  fixture.write('src/views/chat/chat.logic.test.ts')
  fixture.write('src/views/chat/chat.logic.spec.tsx')
  fixture.write('src/views/chat/hooks/use-chat.ts')
  fixture.write('src/views/chat/hooks/use-details.ts')

  const results = await fixture.eslint.lintFiles([
    path.join(fixture.root, 'src'),
  ])

  expect(results).toHaveLength(7)
  expect(results.flatMap((result) => result.messages)).toEqual([])
})

test('each folder has an independent logic-file limit', async (context) => {
  const fixture = createFixture(context)
  fixture.write('src/views/chat/chat.logic.ts')
  fixture.write('src/views/users/users.logic.ts')

  const results = await fixture.eslint.lintFiles(['src'])

  expect(results).toHaveLength(2)
  expect(results.flatMap((result) => result.messages)).toEqual([])
})

test('the combined logic rule uses the application root from a parent cwd', async (context) => {
  const fixture = createFixture(context, { combined: true })
  const first = fixture.write('src/views/chat/chat.logic.ts')
  fixture.write('src/views/chat/details.logic.ts')
  const sibling = fixture.write('../backend/src/views/chat/chat.logic.ts')
  fixture.write('../backend/src/views/chat/details.logic.ts')

  expect(await fixture.lintFile(first)).toEqual([duplicateLogic])
  expect(await fixture.lintFile(sibling)).toEqual([])
})

test('a manually scoped rule leaves non-logic files and unnamed input alone', async (context) => {
  const fixture = createFixture(context, { manual: true })
  fixture.write('src/views/chat/chat.logic.ts')
  fixture.write('src/views/chat/details.logic.ts')
  const view = fixture.write('src/views/chat/chat.view.tsx')
  const otherExtension = fixture.write('src/views/chat/extra.logic.tsx')

  expect(await fixture.lintFile(view)).toEqual([])
  expect(await fixture.lintFile(otherExtension)).toEqual([])
  expect(
    new Linter().verify('export const value = 1', [
      { plugins: { lrs: plugin }, rules: { [ruleId]: 'error' } },
    ]),
  ).toEqual([])
})
