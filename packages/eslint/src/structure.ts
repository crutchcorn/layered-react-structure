import path from 'node:path'
import type { Linter } from 'eslint'
import type { FolderStructureConfig } from 'eslint-plugin-project-structure'
import {
  createFolderStructure,
  projectStructureParser,
} from 'eslint-plugin-project-structure'
import projectStructurePlugin from './structure-plugin.js'

/** Options for the application file and folder structure policy. */
export interface StructureConfigOptions {
  /** Absolute path to the application directory containing `src`. */
  root: string
}

type StructureRuleId =
  | 'modules'
  | 'services'
  | 'types'
  | 'hooks'
  | 'components'
  | 'testingUtilities'
  | 'assets'
type StructureRule = NonNullable<
  FolderStructureConfig<StructureRuleId>['rules']
>[StructureRuleId]

const kebabName = '{kebab-case}'
const moduleFile = { name: `${kebabName}.ts` }
const declarations = { name: `${kebabName}.d.ts` }
const barrel = { name: 'index.ts' }
const tests = { name: `${kebabName}(.(ui|view))?.(spec|test).(ts|tsx)` }
const stories = { name: `${kebabName}(.(ui|view))?.stories.tsx` }
const styles = { name: `${kebabName}(.module)?.(css|scss|sass|less)` }

function recursiveDirectory(
  ruleId: StructureRuleId,
  files: StructureRule[],
): StructureRule {
  return {
    name: kebabName,
    children: [...files, { ruleId }],
  }
}

function layers(): StructureRule[] {
  return [
    { name: 'components', ruleId: 'components' },
    { name: 'constants', ruleId: 'modules' },
    { name: 'hooks', ruleId: 'hooks' },
    {
      name: 'services',
      children: [
        { name: 'schemas', children: [declarations, barrel] },
        moduleFile,
        tests,
        { ruleId: 'services' },
      ],
    },
    { name: 'types', ruleId: 'types' },
    {
      name: 'utils',
      children: [
        // JSX providers and render helpers belong to test infrastructure.
        { name: 'testing-utils', ruleId: 'testingUtilities' },
        moduleFile,
        tests,
        { ruleId: 'modules' },
      ],
    },
    { name: 'assets', ruleId: 'assets' },
  ]
}

function createLrsFolderStructure(root: string) {
  return createFolderStructure({
    // An absolute path avoids upstream node_modules-based root discovery.
    projectRoot: root,
    structureRoot: 'src',
    longPathsInfo: false,
    structure: [
      { name: '(app|main).tsx' },
      { name: '(app|main).(spec|test).tsx' },
      { name: 'vite-env.d.ts' },
      styles,
      ...layers(),
      {
        name: 'views',
        children: [
          {
            name: kebabName,
            children: [
              { name: `${kebabName}.(view|ui).tsx` },
              tests,
              stories,
              styles,
              barrel,
              ...layers(),
            ],
          },
        ],
      },
    ],
    rules: {
      modules: recursiveDirectory('modules', [moduleFile, tests]),
      services: recursiveDirectory('services', [moduleFile, tests]),
      types: recursiveDirectory('types', [moduleFile, declarations, tests]),
      hooks: recursiveDirectory('hooks', [
        { name: `use-${kebabName}.ts` },
        { name: `use-${kebabName}.(spec|test).(ts|tsx)` },
        barrel,
      ]),
      components: recursiveDirectory('components', [
        { name: `${kebabName}(.ui)?.tsx` },
        tests,
        stories,
        styles,
        barrel,
      ]),
      testingUtilities: recursiveDirectory('testingUtilities', [
        { name: `${kebabName}.(ts|tsx)` },
        tests,
      ]),
      assets: recursiveDirectory('assets', [
        {
          name: `${kebabName}.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|mp3|mp4|webm|ogg|wav|wasm|json)`,
        },
      ]),
    },
  })
}

/** Create the optional TypeScript React application path policy. */
export function createStructureConfig({
  root,
}: StructureConfigOptions): Linter.Config[] {
  if (typeof root !== 'string' || !path.isAbsolute(root)) {
    throw new TypeError(
      'LRS structure root must be an absolute project directory',
    )
  }

  // Unlike **/*, these patterns opt arbitrary extensions into ESLint too.
  const files = ['src/**/*.*', 'src/**/!(*.*)']
  return [
    {
      name: 'lrs/structure',
      basePath: root,
      files,
      plugins: { 'project-structure': projectStructurePlugin },
      rules: {
        'project-structure/folder-structure': [
          'error',
          createLrsFolderStructure(root),
        ],
      },
    },
    {
      name: 'lrs/structure-non-code-parser',
      basePath: root,
      files,
      ignores: ['src/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
      languageOptions: {
        // Upstream returns null visitor keys, which ESLint accepts at runtime
        // but excludes from its parser declaration.
        parser: projectStructureParser as unknown as Linter.Parser,
      },
    },
  ]
}
