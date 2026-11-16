import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { findPackageJSON } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('Oxlint applies the packed plugin and its presets', ({
  onTestFinished,
}) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-oxlint-'))
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }))

  const packageDirectory = fileURLToPath(new URL('..', import.meta.url))
  const packResult: Record<string, { filename: string }> = JSON.parse(
    execFileSync(
      'npm',
      [
        'pack',
        '--ignore-scripts',
        '--offline',
        '--json',
        '--cache',
        path.join(directory, 'npm-cache'),
        '--pack-destination',
        directory,
      ],
      { cwd: packageDirectory, encoding: 'utf8' },
    ),
  )

  const [packed] = Object.values(packResult)
  if (!packed) throw new Error('npm pack must produce a package')

  const modulesDirectory = path.join(directory, 'node_modules')
  const pluginDirectory = path.join(modulesDirectory, 'lrs-oxlint-plugin')
  mkdirSync(pluginDirectory, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    path.join(directory, packed.filename),
    '-C',
    pluginDirectory,
    '--strip-components=1',
  ])

  for (const dependency of [
    '@oxlint/plugins',
    'eslint-plugin-project-structure',
    'oxlint',
  ]) {
    const manifest = findPackageJSON(dependency, import.meta.url)
    if (!manifest) throw new Error(`Could not resolve ${dependency}`)
    const destination = path.join(modulesDirectory, dependency)
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(path.dirname(manifest), destination, 'junction')
  }

  function write(file: string, contents: string) {
    const filename = path.join(directory, file)
    mkdirSync(path.dirname(filename), { recursive: true })
    writeFileSync(filename, contents)
  }

  write(
    'oxlint.config.mjs',
    `import { configs, createLrsConfig } from 'lrs-oxlint-plugin'
    export default {
      extends: [createLrsConfig({ root: import.meta.dirname }), configs.strict],
      categories: { correctness: 'off' },
      overrides: [{
        files: ['src/views/chat/allowed.ui.tsx'],
        rules: { 'lrs/presentation-imports': ['error', { allow: [{ hooks: ['useChat'] }] }] },
      }],
    }`,
  )

  write(
    'src/views/chat/chat.ui.tsx',
    "import { useChat } from '../../hooks/use-chat'; fetch('/chat')",
  )
  write(
    'src/views/chat/allowed.ui.tsx',
    "import { useChat } from '../../hooks/use-chat'",
  )
  write(
    'src/views/chat/chat.view.tsx',
    "import '../profile/profile.view'; export default () => <div />",
  )
  write('src/views/chat/details.view.tsx', 'export {}')
  write('src/views/chat/chat.logic.ts', 'export {}')
  write('src/views/chat/details.logic.ts', 'export {}')
  write(
    'src/hooks/use-a.ts',
    `import ReactA from 'react'
    ReactA.createElement('div')
    const ReactB = { createElement() {} }
    ReactB.createElement()`,
  )
  write(
    'src/hooks/use-b.ts',
    `import ReactB from 'react'
    const ReactA = { createElement() {} }
    ReactA.createElement()`,
  )
  write('src/components/with-jsx.tsx', 'export default () => <div />')
  write('src/components/without-jsx.tsx', 'export const answer = 42')
  write(
    'src/services/db.ts',
    "function local(require: (id: string) => unknown) { return require('react') }\nrequire('react')",
  )
  write('src/utils/types.ts', "export type * from 'react'")
  write('src/utils/wildcard.ts', "export * from 'react'")
  write(
    'src/views/chat/chat.ui.spec.tsx',
    "import '../../services/db'; fetch('/chat')",
  )
  write('src/BadFile.ts', 'export {}')

  const result = spawnSync(
    process.execPath,
    [
      path.join(modulesDirectory, 'oxlint/bin/oxlint'),
      '-c',
      'oxlint.config.mjs',
      '--threads=1',
      '--format=json',
      'src',
    ],
    { cwd: directory, encoding: 'utf8' },
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr || result.stdout).toBe(1)
  expect(result.stdout, result.stderr).not.toBe('')

  const { diagnostics }: { diagnostics: { code: string; filename: string }[] } =
    JSON.parse(result.stdout)
  const actual = diagnostics
    .map(({ code, filename }) => `${filename}: ${code}`)
    .sort()

  expect(actual).toEqual(
    [
      'src/views/chat/chat.ui.tsx: lrs(presentation-imports)',
      'src/views/chat/chat.ui.tsx: lrs(no-application-io)',
      'src/views/chat/chat.view.tsx: lrs(feature-imports)',
      'src/views/chat/chat.view.tsx: lrs(view-composition)',
      'src/views/chat/chat.view.tsx: lrs(one-view-per-folder)',
      'src/views/chat/details.view.tsx: lrs(one-view-per-folder)',
      'src/views/chat/chat.logic.ts: lrs(one-logic-per-folder)',
      'src/views/chat/details.logic.ts: lrs(one-logic-per-folder)',
      'src/hooks/use-a.ts: lrs(hook-rendering)',
      'src/components/without-jsx.tsx: lrs(component-placement)',
      'src/services/db.ts: lrs(service-imports)',
      'src/utils/wildcard.ts: lrs(utility-imports)',
      'src/BadFile.ts: lrs(folder-structure)',
    ].sort(),
  )
}, 30_000)
