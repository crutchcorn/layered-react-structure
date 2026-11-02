import path from 'node:path'
import type { TSESLint } from '@typescript-eslint/utils'
import {
  endsWithSegments,
  isComponent,
  isLayer,
  isRelative,
  staysInLayer,
  visitModuleSources,
} from '../module-sources.js'

interface AllowEntry {
  /** Module path matched against the end of each import path; omit to match any module. */
  from?: string
  /** Named imports allowed from the module; omit to allow the whole module. */
  hooks?: string[]
}

interface PresentationImportsOptions {
  allow?: AllowEntry[]
}

const presentationImports: TSESLint.RuleModule<
  'forbiddenImport',
  [PresentationImportsOptions?]
> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep presentational components independent of application dependencies.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string', minLength: 1 },
                hooks: {
                  type: 'array',
                  items: { type: 'string', minLength: 1 },
                  minItems: 1,
                  uniqueItems: true,
                },
              },
              additionalProperties: false,
              anyOf: [
                { type: 'object', required: ['from'] },
                { type: 'object', required: ['hooks'] },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenImport:
        'Presentational components must not import "{{source}}". Receive data and actions through props; compose services, hooks, views, and TanStack dependencies outside the UI layer. Name a presentation-only hook use-*.ui.ts, or list a safe hook in this rule\'s "allow" option.',
    },
  },
  create(context) {
    const allow = context.options[0]?.allow ?? []
    const directory = path.posix.dirname(context.filename.replace(/\\/g, '/'))

    return visitModuleSources(context, (source, names) => {
      const inLayer = (layer: string) =>
        isLayer(source, layer) || staysInLayer(directory, source, layer)
      const forbidden =
        inLayer('services') ||
        // Hooks named *.ui follow this rule themselves, so they stay presentational.
        (inLayer('hooks') && !isComponent(source, 'ui')) ||
        isComponent(source, 'view') ||
        source.startsWith('@tanstack/')
      if (!forbidden) return false

      const target = isRelative(source)
        ? path.posix.join(directory, source)
        : source
      const entries = allow.filter(
        (entry) =>
          entry.from === undefined || endsWithSegments(target, entry.from),
      )
      if (entries.some((entry) => entry.hooks === undefined)) return false
      // Side-effect imports, export *, import(), and require() take the whole module.
      if (names === undefined) return true
      return !names.every((name) =>
        entries.some((entry) => entry.hooks?.includes(name)),
      )
    })
  },
}

export default presentationImports
