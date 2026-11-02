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

interface PresentationImportsOptions {
  /** Module paths that are safe for presentation, matched against the end of each import path. */
  allow?: string[]
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
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenImport:
        'Presentational components must not import "{{source}}". Receive data and actions through props; compose services, hooks, views, and TanStack dependencies outside the UI layer. Name a presentation-only hook use-*.ui.ts, or list a safe module in this rule\'s "allow" option.',
    },
  },
  create(context) {
    const allow = context.options[0]?.allow ?? []
    const directory = path.posix.dirname(context.filename.replace(/\\/g, '/'))

    return visitModuleSources(context, (source) => {
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
      return !allow.some((entry) => endsWithSegments(target, entry))
    })
  },
}

export default presentationImports
