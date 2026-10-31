import path from 'node:path'
import type { TSESLint } from '@typescript-eslint/utils'
import { visitModuleSources } from '../module-sources.js'

/** Feature names from each `views/<feature>` pair in a path, outermost first. */
function featureNames(modulePath: string): string[] {
  const segments = modulePath.split('/').filter(Boolean)
  const names: string[] = []
  segments.forEach((segment, index) => {
    const feature = segments[index + 1]
    if (segment === 'views' && feature !== undefined) names.push(feature)
  })
  return names
}

function isRelative(source: string): boolean {
  return (
    source === '.' ||
    source === '..' ||
    source.startsWith('./') ||
    source.startsWith('../')
  )
}

const featureImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep each view feature independent of other view features.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Features must not import "{{source}}" from another feature under views/. Move code that multiple features share to the matching src-level layer, such as hooks/, components/, or utils/, and make it generic enough for each consumer.',
    },
  },
  create(context) {
    const directory = path.posix.dirname(context.filename.replace(/\\/g, '/'))
    const features = featureNames(directory)
    if (features.length === 0) return {}

    return visitModuleSources(context, (source) => {
      const target = isRelative(source)
        ? path.posix.join(directory, source)
        : source
      // Nested sub-features may reach their ancestors and descendants, not siblings.
      return featureNames(target).some(
        (name, index) => index < features.length && name !== features[index],
      )
    })
  },
}

export default featureImports
