import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { ESLint, Rule } from 'eslint'
import { projectStructurePlugin } from 'eslint-plugin-project-structure'
import type { CreateOnceRule } from './create-once-rule.js'

// Upstream uses typescript-eslint's narrower AST and context declarations;
// its rule objects implement ESLint's runtime plugin interface.
const upstreamPlugin = projectStructurePlugin as unknown as ESLint.Plugin & {
  rules: { 'folder-structure': Rule.RuleModule }
}
const folderStructure = upstreamPlugin.rules['folder-structure']

export const folderStructureRule: CreateOnceRule<Rule.RuleModule> = {
  meta: folderStructure.meta,
  createOnce(context) {
    return {
      Program(node) {
        // Upstream skips this reserved name; caches live outside src here.
        if (context.filename.includes('projectStructure.cache.json')) {
          context.report({
            node,
            messageId: 'error',
            data: {
              error:
                'projectStructure.cache.json is reserved for the structure checker. Rename this path.',
            },
          })
          return
        }

        // Upstream deduplicates folder errors across files in a disk cache.
        // Isolate each check so editor/partial lint runs cannot hide errors.
        const directory = mkdtempSync(path.join(tmpdir(), 'lrs-structure-'))
        try {
          const isolatedContext: typeof context = Object.create(context, {
            settings: {
              value: {
                ...context.settings,
                'project-structure/cache-location': directory,
              },
            },
          })
          folderStructure.create(isolatedContext).Program?.(node)
        } finally {
          rmSync(directory, { recursive: true, force: true })
        }
      },
    }
  },
}
