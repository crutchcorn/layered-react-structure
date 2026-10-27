import type { Rule } from 'eslint'
import { checkOneFilePerFolder } from '../one-file-per-folder.js'

const oneLogicPerFolder: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow at most one .logic.ts file in each folder.',
    },
    schema: [],
    messages: {
      multipleLogicFiles:
        "Only one .logic.ts file is allowed per folder. Found: {{files}}. Move logic that needs further decomposition into this folder's hooks/ directory.",
    },
  },
  create(context) {
    return checkOneFilePerFolder(context, /\.logic\.ts$/i, 'multipleLogicFiles')
  },
}

export default oneLogicPerFolder
