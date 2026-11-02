import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

const networkConstructors = new Set([
  'EventSource',
  'WebSocket',
  'XMLHttpRequest',
])
const browserStorage = new Set(['indexedDB', 'localStorage', 'sessionStorage'])

function isUnshadowedGlobal(
  context: TSESLint.RuleContext<'effect', []>,
  node: TSESTree.Identifier,
): boolean {
  let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get(node.name)
    if (variable) return variable.defs.length === 0
    scope = scope.upper
  }
  return true
}

const noApplicationIo: TSESLint.RuleModule<'effect', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep network and browser-storage effects out of presentation and utility modules.',
    },
    schema: [],
    messages: {
      effect:
        'Keep network and browser-storage effects in application hooks and services; presentation and utility modules must stay effect-free.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          (node.callee.type === 'Identifier' && node.callee.name === 'fetch') ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'fetch')
        ) {
          context.report({ node, messageId: 'effect' })
        }
      },
      NewExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          networkConstructors.has(node.callee.name)
        ) {
          context.report({ node, messageId: 'effect' })
        }
      },
      Identifier(node) {
        if (
          !browserStorage.has(node.name) ||
          (node.parent.type === 'MemberExpression' &&
            node.parent.property === node &&
            !node.parent.computed) ||
          (node.parent.type === 'Property' &&
            node.parent.key === node &&
            !node.parent.computed &&
            !node.parent.shorthand)
        ) {
          return
        }
        if (isUnshadowedGlobal(context, node)) {
          context.report({ node, messageId: 'effect' })
        }
      },
      MemberExpression(node) {
        if (
          node.property.type === 'Identifier' &&
          browserStorage.has(node.property.name)
        ) {
          context.report({ node, messageId: 'effect' })
        }
      },
    }
  },
}

export default noApplicationIo
