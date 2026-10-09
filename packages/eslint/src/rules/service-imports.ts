import type { TSESLint } from '@typescript-eslint/utils'
import { isComponent, isLayer, visitModuleSources } from '../module-sources.js'

const serviceImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep I/O services independent of React and component layers.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Services must not import "{{source}}". Services own I/O and resource lifetimes; keep React, hooks, views, and presentation components outside the service layer.',
    },
  },
  create(context) {
    return visitModuleSources(
      context,
      (source) =>
        source === 'react' ||
        source.startsWith('react/') ||
        source === 'react-dom' ||
        source.startsWith('react-dom/') ||
        source.startsWith('@tanstack/react-') ||
        isLayer(source, 'hooks') ||
        isComponent(source, 'view') ||
        isComponent(source, 'ui'),
    )
  },
}

export default serviceImports
