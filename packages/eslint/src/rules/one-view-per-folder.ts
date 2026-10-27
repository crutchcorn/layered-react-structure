import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Rule } from 'eslint'

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
    const filename = path.resolve(context.cwd, context.physicalFilename)
    if (!viewFile.test(path.basename(filename))) return {}

    return {
      Program(node) {
        const directory = path.dirname(filename)
        // Include an editor buffer even before its file has been saved.
        const views = new Set([path.basename(filename)])
        let entries
        try {
          // Read siblings every time so partial/editor lint sees additions/removals.
          entries = readdirSync(directory, { withFileTypes: true })
        } catch (error) {
          if (
            error instanceof Error &&
            'code' in error &&
            (error.code === 'ENOENT' || error.code === 'ENOTDIR')
          ) {
            return
          }
          throw error
        }

        for (const entry of entries) {
          if (!viewFile.test(entry.name)) continue
          if (
            entry.isFile() ||
            (entry.isSymbolicLink() &&
              statSync(path.join(directory, entry.name), {
                throwIfNoEntry: false,
              })?.isFile())
          ) {
            views.add(entry.name)
          }
        }

        if (views.size > 1) {
          context.report({
            node,
            messageId: 'multipleViews',
            data: { files: [...views].sort().join(', ') },
          })
        }
      },
    }
  },
}

export default oneViewPerFolder
