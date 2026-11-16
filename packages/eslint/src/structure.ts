import type { Linter } from 'eslint'
import { projectStructureParser } from 'eslint-plugin-project-structure'
import { createLrsFolderStructure } from '../../oxlint/src/folder-structure.js'
import type { StructureConfigOptions } from '../../oxlint/src/config-options.js'
import projectStructurePlugin from './structure-plugin.js'

/** Create the optional TypeScript React application path policy. */
export function createStructureConfig({
  root,
  ignorePatterns,
}: StructureConfigOptions): Linter.Config[] {
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
          createLrsFolderStructure(root, ignorePatterns),
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
