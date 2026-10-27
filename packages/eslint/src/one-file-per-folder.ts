import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { Rule } from 'eslint'

/** Check immediate siblings, including a file that only exists in an editor. */
export function checkOneFilePerFolder(
  context: Rule.RuleContext,
  pattern: RegExp,
  messageId: string,
): Rule.RuleListener {
  const filename = path.resolve(context.cwd, context.physicalFilename)
  if (!pattern.test(path.basename(filename))) return {}

  return {
    Program(node) {
      const directory = path.dirname(filename)
      // Include an editor buffer even before its file has been saved.
      const files = new Set([path.basename(filename)])
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
        if (!pattern.test(entry.name)) continue
        if (
          entry.isFile() ||
          (entry.isSymbolicLink() &&
            statSync(path.join(directory, entry.name), {
              throwIfNoEntry: false,
            })?.isFile())
        ) {
          files.add(entry.name)
        }
      }

      if (files.size > 1) {
        context.report({
          node,
          messageId,
          data: { files: [...files].sort().join(', ') },
        })
      }
    },
  }
}
