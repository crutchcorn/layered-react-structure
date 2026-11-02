import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { isComponent, isLayer, visitModuleSources } from '../module-sources.js'

function isTypeOnlyReference(node: TSESTree.Node): boolean {
  let parent = node.parent
  while (parent?.type === 'TSLiteralType') parent = parent.parent
  if (!parent) return false

  if (parent.type === 'ImportDeclaration') {
    return (
      parent.importKind === 'type' ||
      (parent.specifiers.length > 0 &&
        parent.specifiers.every(
          (specifier) =>
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type',
        ))
    )
  }
  if (parent.type === 'ExportNamedDeclaration') {
    return (
      parent.exportKind === 'type' ||
      (parent.specifiers.length > 0 &&
        parent.specifiers.every((specifier) => specifier.exportKind === 'type'))
    )
  }
  if (parent.type === 'TSImportType') return true
  if (parent.type === 'TSExternalModuleReference') {
    const declaration = parent.parent
    return (
      declaration.type === 'TSImportEqualsDeclaration' &&
      declaration.importKind === 'type'
    )
  }
  return false
}

function isReactRuntime(source: string): boolean {
  return (
    source === 'react' ||
    source.startsWith('react/') ||
    source === 'react-dom' ||
    source.startsWith('react-dom/') ||
    /^@tanstack\/react-[^/]+(?:\/|$)/u.test(source)
  )
}

const utilityImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep pure utilities independent of application, presentation, and React runtime layers.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Utilities must not import "{{source}}". Keep application and presentation dependencies in their owning layers; type-only React contracts are allowed.',
    },
  },
  create(context) {
    return visitModuleSources(context, (source, _names, node) => {
      if (
        ['components', 'hooks', 'services', 'views'].some((layer) =>
          isLayer(source, layer),
        ) ||
        (['view', 'ui'] as const).some((kind) => isComponent(source, kind)) ||
        /\.logic(?:\.[cm]?[jt]sx?)?$/iu.test(source)
      ) {
        return true
      }
      return isReactRuntime(source) && !isTypeOnlyReference(node)
    })
  },
}

export default utilityImports
