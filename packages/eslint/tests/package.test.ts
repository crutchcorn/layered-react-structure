import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const packageDirectory = fileURLToPath(new URL('..', import.meta.url))

interface PackedPackage {
  name: string
  filename: string
  files: { path: string }[]
}

interface PackageManifest {
  types: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function run(command: string, args: string[], cwd: string): string {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const stdout =
      error instanceof Error && 'stdout' in error ? error.stdout : ''
    const stderr =
      error instanceof Error && 'stderr' in error ? error.stderr : ''
    expect.unreachable(
      `${command} ${args.join(' ')}\n${String(error)}\n${stdout}\n${stderr}`,
    )
  }
}

test('published tarball supports ESM and strict TypeScript consumers', (context) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'lrs-package-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )

  // Test the actual npm artifact, without invoking build scripts or contacting npm.
  const [packed]: PackedPackage[] = JSON.parse(
    run(
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
      packageDirectory,
    ),
  )
  if (!packed) expect.unreachable('npm pack must produce a package')
  const contents = packed.files.map((file) => file.path)
  for (const expected of ['dist/index.js', 'dist/index.d.ts', 'README.md']) {
    expect(contents, `Missing package file: ${expected}`).toContain(expected)
  }
  expect(contents).not.toContainEqual(expect.stringMatching(/^src\//))
  expect(contents).not.toContainEqual(expect.stringMatching(/^tests\//))

  const consumerDirectory = path.join(directory, 'consumer')
  const modulesDirectory = path.join(consumerDirectory, 'node_modules')
  const installedDirectory = path.join(modulesDirectory, packed.name)
  mkdirSync(installedDirectory, { recursive: true })
  run(
    'tar',
    [
      '-xzf',
      path.join(directory, packed.filename),
      '-C',
      installedDirectory,
      '--strip-components=1',
    ],
    directory,
  )
  const manifest: PackageManifest = JSON.parse(
    readFileSync(path.join(installedDirectory, 'package.json'), 'utf8'),
  )
  expect(existsSync(path.join(installedDirectory, manifest.types))).toBe(true)

  // Reuse installed runtime dependencies, but expose no workspace devDependencies.
  for (const dependency of Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
  })) {
    const destination = path.join(modulesDirectory, dependency)
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(
      path.dirname(require.resolve(`${dependency}/package.json`)),
      destination,
      'junction',
    )
  }

  writeFileSync(
    path.join(consumerDirectory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  )
  for (const extension of ['js', 'ts']) {
    copyFileSync(
      new URL(`fixtures/consumer.${extension}`, import.meta.url),
      path.join(consumerDirectory, `consumer.${extension}`),
    )
  }

  expect(
    JSON.parse(run(process.execPath, ['consumer.js'], consumerDirectory)),
  ).toEqual({
    importRuleIds: ['lrs/service-imports'],
    viewRuleIds: ['lrs/one-view-per-folder'],
    logicRuleIds: ['lrs/one-logic-per-folder'],
    featureRuleIds: ['lrs/feature-imports'],
    structureRuleIds: ['project-structure/folder-structure'],
  })

  for (const module of ['NodeNext', 'Preserve']) {
    writeFileSync(
      path.join(consumerDirectory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          target: 'ES2022',
          module,
          moduleResolution: module === 'NodeNext' ? 'NodeNext' : 'Bundler',
          types: [],
        },
        files: ['consumer.ts'],
      }),
    )
    run(
      process.execPath,
      [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'],
      consumerDirectory,
    )
  }
}, 30_000)
