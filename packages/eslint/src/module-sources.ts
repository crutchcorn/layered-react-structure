import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

type ImportRuleContext = TSESLint.RuleContext<
  'forbiddenImport',
  readonly unknown[]
>

function staticSource(
  node: TSESTree.Node | null | undefined,
): string | undefined {
  if (!node) return undefined
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? undefined
  }
  // Older TypeScript parser versions represent import types with a literal type.
  if (node.type === 'TSLiteralType') return staticSource(node.literal)
  return undefined
}

function isUnshadowedRequire(
  context: ImportRuleContext,
  node: TSESTree.CallExpression,
): boolean {
  let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get('require')
    if (variable) return variable.defs.length === 0
    scope = scope.upper
  }
  return true
}

/** Visit statically known module references without resolving application aliases. */
export function visitModuleSources(
  context: ImportRuleContext,
  isForbidden: (source: string) => boolean,
): TSESLint.RuleListener {
  function check(node: TSESTree.Node | null | undefined): void {
    if (!node) return
    const source = staticSource(node)
    if (source !== undefined && isForbidden(normalizeModuleSource(source))) {
      context.report({
        node,
        messageId: 'forbiddenImport',
        data: { source },
      })
    }
  }

  return {
    ImportDeclaration: (node) => check(node.source),
    ExportNamedDeclaration: (node) => check(node.source),
    ExportAllDeclaration: (node) => check(node.source),
    ImportExpression: (node) => check(node.source),
    TSImportType: (node) => check(node.source ?? node.argument),
    TSExternalModuleReference: (node) => check(node.expression),
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        isUnshadowedRequire(context, node)
      ) {
        check(node.arguments[0])
      }
    },
  }
}

function normalizeModuleSource(source: string): string {
  const normalized = source.replace(/\\/g, '/')
  // Bundler query/fragment suffixes must not hide a component's file extension.
  // Keep a leading # intact for package.json import aliases.
  const suffixes = [normalized.indexOf('?'), normalized.indexOf('#', 1)].filter(
    (index) => index >= 0,
  )
  return suffixes.length > 0
    ? normalized.slice(0, Math.min(...suffixes))
    : normalized
}

export function isRelative(source: string): boolean {
  return (
    source === '.' ||
    source === '..' ||
    source.startsWith('./') ||
    source.startsWith('../')
  )
}

function pathSegments(modulePath: string): string[] {
  return modulePath
    .replace(/\.[cm]?[jt]sx?$/i, '')
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.')
}

/** Whether a module path ends with the entry's whole segments, ignoring a source extension. */
export function endsWithSegments(modulePath: string, entry: string): boolean {
  const target = pathSegments(modulePath)
  const suffix = pathSegments(entry.replace(/\\/g, '/'))
  const offset = target.length - suffix.length
  return (
    suffix.length > 0 &&
    offset >= 0 &&
    suffix.every((segment, index) => segment === target[offset + index])
  )
}

export function isLayer(source: string, layer: string): boolean {
  return source.split('/').includes(layer)
}

const structuralFolders = new Set([
  'src',
  'views',
  'assets',
  'components',
  'constants',
  'hooks',
  'services',
  'types',
  'utils',
])

/** Whether a relative import stays inside the importer's nearest enclosing `layer` folder. */
export function staysInLayer(
  directory: string,
  source: string,
  layer: string,
): boolean {
  if (!isRelative(source)) return false
  const segments = directory.split('/')
  let nearest = segments.length - 1
  while (nearest >= 0 && !structuralFolders.has(segments[nearest] ?? '')) {
    nearest--
  }
  if (segments[nearest] !== layer) return false

  let depth = segments.length - 1 - nearest
  for (const segment of source.split('/')) {
    if (segment === '..') depth--
    else if (segment !== '.' && segment !== '') depth++
    if (depth < 0) return false
  }
  return true
}

export function isComponent(source: string, kind: 'view' | 'ui'): boolean {
  // Extensionless imports and both source/output JavaScript extensions count.
  return new RegExp(`\\.${kind}(?:\\.[cm]?[jt]sx?)?$`, 'i').test(source)
}
