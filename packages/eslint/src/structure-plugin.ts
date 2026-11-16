import { eslintCompatPlugin } from '@oxlint/plugins'
import type { Plugin } from '@oxlint/plugins'
import type { ESLint } from 'eslint'
import { projectStructurePlugin } from 'eslint-plugin-project-structure'
import { folderStructureRule } from '../../oxlint/src/folder-structure-rule.js'

const isolatedProjectStructurePlugin = eslintCompatPlugin({
  ...projectStructurePlugin,
  rules: {
    ...projectStructurePlugin.rules,
    'folder-structure': folderStructureRule,
  },
} as unknown as Plugin) as unknown as ESLint.Plugin

export default isolatedProjectStructurePlugin
