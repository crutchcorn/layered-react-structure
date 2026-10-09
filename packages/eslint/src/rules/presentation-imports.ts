import type { TSESLint } from '@typescript-eslint/utils'
import { isComponent, isLayer, visitModuleSources } from '../module-sources.js'

const presentationImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep presentational components independent of application dependencies.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Presentational components must not import "{{source}}". Receive data and actions through props; compose services, hooks, views, and TanStack dependencies outside the UI layer.',
    },
  },
  create(context) {
    return visitModuleSources(
      context,
      (source) =>
        isLayer(source, 'services') ||
        isLayer(source, 'hooks') ||
        isComponent(source, 'view') ||
        source.startsWith('@tanstack/'),
    )
  },
}

export default presentationImports
