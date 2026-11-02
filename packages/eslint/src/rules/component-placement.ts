import type { TSESLint } from '@typescript-eslint/utils'

const componentPlacement: TSESLint.RuleModule<'hook' | 'render', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep hook implementations and non-rendering modules out of component folders.',
    },
    schema: [],
    messages: {
      hook: 'Move reusable React logic to a use-*.ts module in hooks/. Components own rendering.',
      render:
        'This component module does not render React elements. Move its hooks, utilities, constants, or contracts to the matching layer.',
    },
  },
  create(context) {
    let renders = false
    return {
      JSXElement() {
        renders = true
      },
      JSXFragment() {
        renders = true
      },
      CallExpression(node) {
        if (
          (node.callee.type === 'Identifier' &&
            node.callee.name === 'createElement') ||
          (node.callee.type === 'MemberExpression' &&
            !node.callee.computed &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'createElement')
        ) {
          renders = true
        }
      },
      FunctionDeclaration(node) {
        if (node.id && /^use[A-Z]/u.test(node.id.name)) {
          context.report({ node, messageId: 'hook' })
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          /^use[A-Z]/u.test(node.id.name) &&
          (node.init?.type === 'ArrowFunctionExpression' ||
            node.init?.type === 'FunctionExpression')
        ) {
          context.report({ node, messageId: 'hook' })
        }
      },
      'Program:exit'(node) {
        const barrel = node.body.every(
          (statement) =>
            statement.type === 'ImportDeclaration' ||
            statement.type === 'ExportAllDeclaration' ||
            (statement.type === 'ExportNamedDeclaration' &&
              statement.declaration === null),
        )
        if (!renders && !barrel) context.report({ node, messageId: 'render' })
      },
    }
  },
}

export default componentPlacement
