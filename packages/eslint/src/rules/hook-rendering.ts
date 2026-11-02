import type { TSESLint } from '@typescript-eslint/utils'

const hookRendering: TSESLint.RuleModule<'render', []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep React rendering in components and views, not hooks.',
    },
    schema: [],
    messages: {
      render:
        'Hooks return behavior and state; render elements in components or views.',
    },
  },
  create(context) {
    const namespaces = new Set<string>()
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react') return
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            const name =
              specifier.imported.type === 'Identifier'
                ? specifier.imported.name
                : specifier.imported.value
            if (name === 'createElement') {
              context.report({ node: specifier, messageId: 'render' })
            }
          } else {
            namespaces.add(specifier.local.name)
          }
        }
      },
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          namespaces.has(node.object.name) &&
          node.property.type === 'Identifier' &&
          node.property.name === 'createElement'
        ) {
          context.report({ node, messageId: 'render' })
        }
      },
      JSXElement(node) {
        context.report({ node, messageId: 'render' })
      },
      JSXFragment(node) {
        context.report({ node, messageId: 'render' })
      },
    }
  },
}

export default hookRendering
