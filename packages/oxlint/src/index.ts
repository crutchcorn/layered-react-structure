import { definePlugin } from '@oxlint/plugins'
import type { Plugin } from '@oxlint/plugins'
import type { OxlintConfig } from 'oxlint'
import packageJson from '../package.json' with { type: 'json' }
import { folderStructureRule } from './folder-structure-rule.js'
import { createLrsFolderStructure } from './folder-structure.js'
import type { StructureConfigOptions } from './config-options.js'
import { recommended, strict } from './presets.js'
import type { RuleScope } from './presets.js'
import { rules } from './rules.js'

export type LrsConfigOptions = StructureConfigOptions

// The shared visitors use typescript-eslint's AST and context types.
export default definePlugin({
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: {
    ...rules,
    'folder-structure': folderStructureRule,
  },
} as unknown as Plugin)

const jsPlugins = [{ name: 'lrs', specifier: packageJson.name }]

function createPreset(scopes: RuleScope[]): OxlintConfig {
  return {
    jsPlugins,
    overrides: scopes.map(({ rule, files, ignores }) => ({
      files,
      ...(ignores && { excludeFiles: ignores }),
      rules: { [`lrs/${rule}`]: 'error' },
    })),
  }
}

export const configs = {
  recommended: createPreset(recommended),
  strict: createPreset(strict),
}

/** Apply layer boundaries and the file layout to one React application. */
export function createLrsConfig({
  root,
  ignorePatterns,
}: LrsConfigOptions): OxlintConfig {
  return {
    ...configs.recommended,
    overrides: [
      ...(configs.recommended.overrides ?? []),
      {
        files: ['src/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        rules: {
          'lrs/folder-structure': [
            'error',
            createLrsFolderStructure(root, ignorePatterns),
          ],
        },
      },
    ],
  }
}
