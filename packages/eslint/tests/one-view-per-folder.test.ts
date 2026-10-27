import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint, Linter } from 'eslint'
import plugin, { createLrsConfig } from 'lrs-eslint-plugin'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'

const ruleId = 'lrs/one-view-per-folder'
const duplicateView = expect.objectContaining({
  ruleId,
  messageId: 'multipleViews',
  severity: 2,
})

function createFixture(
  context: TestContext,
  { combined = false, manual = false } = {},
) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-one-view-'))
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
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
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
      writeFileSync(target, 'export const View = () => null')
      return target
    },
    async lintFile(filename: string) {
      const [result] = await eslint.lintFiles([filename])
      expect.assert(result, 'The view must be selected for linting')
      return result.messages
    },
  }
}

test('partial linting reports either view when its folder contains two views', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/views/chat/chat.view.tsx')
  const second = fixture.write('src/views/chat/details.view.tsx')

  expect(await fixture.lintFile(first)).toEqual([duplicateView])
  expect(await fixture.lintFile(second)).toEqual([duplicateView])
})

test('an unsaved view counts alongside its existing sibling', async (context) => {
  const fixture = createFixture(context)
  fixture.write('src/views/chat/chat.view.tsx')

  const [result] = await fixture.eslint.lintText(
    'export const Details = () => null',
    { filePath: path.join(fixture.root, 'src/views/chat/details.view.tsx') },
  )

  expect(result?.messages).toEqual([duplicateView])
})

test('tests, stories, UI companions, and directories do not count as views', async (context) => {
  const fixture = createFixture(context)
  const view = fixture.write('src/views/chat/chat.view.tsx')
  fixture.write('src/views/chat/chat.view.test.tsx')
  fixture.write('src/views/chat/chat.view.spec.tsx')
  fixture.write('src/views/chat/chat.view.stories.tsx')
  fixture.write('src/views/chat/chat.ui.tsx')
  fixture.write('src/views/chat/details.ui.tsx')
  const directory = path.join(fixture.root, 'src/views/chat/directory.view.tsx')
  mkdirSync(directory)
  symlinkSync(
    directory,
    path.join(fixture.root, 'src/views/chat/link.view.tsx'),
  )

  expect(await fixture.lintFile(view)).toEqual([])
})

test('a symlink to a view file counts as a sibling view', async (context) => {
  const fixture = createFixture(context)
  const view = fixture.write('src/views/chat/chat.view.tsx')
  const target = fixture.write('src/views/details/details.view.tsx')
  symlinkSync(
    target,
    path.join(fixture.root, 'src/views/chat/details.view.tsx'),
  )

  expect(await fixture.lintFile(view)).toEqual([duplicateView])
})

for (const extension of ['ts', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts']) {
  test(`views with .tsx and .${extension} extensions share the same folder limit`, async (context) => {
    const fixture = createFixture(context)
    const first = fixture.write('src/views/chat/chat.view.tsx')
    const second = fixture.write(`src/views/chat/details.view.${extension}`)

    expect(await fixture.lintFile(first)).toEqual([duplicateView])
    expect(await fixture.lintFile(second)).toEqual([duplicateView])
  })
}

test('sibling and nested folders each permit their own view', async (context) => {
  const fixture = createFixture(context)
  fixture.write('src/views/chat/chat.view.tsx')
  fixture.write('src/views/chat/nested/details.view.tsx')
  fixture.write('src/views/users/users.view.tsx')

  const results = await fixture.eslint.lintFiles(['src'])

  expect(results).toHaveLength(3)
  expect(results.flatMap((result) => result.messages)).toEqual([])
})

test('the same ESLint instance observes views being added and removed', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/views/chat/chat.view.tsx')
  expect(await fixture.lintFile(first)).toEqual([])

  const second = fixture.write('src/views/chat/details.view.tsx')
  expect(await fixture.lintFile(first)).toEqual([duplicateView])

  unlinkSync(second)
  expect(await fixture.lintFile(first)).toEqual([])
})

test('manually applying the rule broadly leaves non-view files and unnamed input alone', async (context) => {
  const fixture = createFixture(context, { manual: true })
  fixture.write('src/views/chat/chat.view.tsx')
  fixture.write('src/views/chat/details.view.tsx')
  const ui = fixture.write('src/views/chat/chat.ui.tsx')

  expect(await fixture.lintFile(ui)).toEqual([])
  expect(
    new Linter().verify('export const value = 1', [
      { plugins: { lrs: plugin }, rules: { [ruleId]: 'error' } },
    ]),
  ).toEqual([])
})

test('the combined config checks its application from a parent cwd and leaves sibling applications alone', async (context) => {
  const fixture = createFixture(context, { combined: true })
  const first = fixture.write('src/views/chat/chat.view.tsx')
  fixture.write('src/views/chat/details.view.tsx')
  const sibling = fixture.write('../backend/src/views/chat/chat.view.tsx')
  fixture.write('../backend/src/views/chat/details.view.tsx')

  expect(await fixture.lintFile(first)).toEqual([duplicateView])
  expect(await fixture.lintFile(sibling)).toEqual([])
})
