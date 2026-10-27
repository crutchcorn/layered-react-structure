import type { Rule } from 'eslint'
import { checkOneFilePerFolder } from '../one-file-per-folder.js'

// Match production source files, excluding colocated tests and stories.
const viewFile = /\.view\.(?:[cm]?[jt]s|[jt]sx)$/i

const oneViewPerFolder: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow at most one view file in each folder.',
    },
    schema: [],
    messages: {
      multipleViews:
        'Only one .view file is allowed per folder. Found: {{files}}. Keep orchestration in one view and extract business logic into hooks, services, or utilities.',
    },
  },
  create(context) {
    return checkOneFilePerFolder(context, viewFile, 'multipleViews')
  },
}

export default oneViewPerFolder
