import type { TSESLint } from '@typescript-eslint/utils'

const viewComposition: TSESLint.RuleModule<'styling' | 'element', []> = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      styling:
        'Keep styling out of views. Move className and style attributes to the paired UI or a presentational component.',
      element:
        'Views compose UI and presentational components; move DOM markup to the paired UI or a presentational component.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          (node.name.name === 'className' || node.name.name === 'style')
        ) {
          context.report({ node, messageId: 'styling' })
        }
      },
      JSXOpeningElement(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          /^[a-z]/u.test(node.name.name)
        ) {
          context.report({ node: node.name, messageId: 'element' })
        }
      },
    }
  },
}

export default viewComposition
