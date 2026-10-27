import { ESLint } from 'eslint'
import type { Linter, Rule } from 'eslint'
import { defineConfig } from 'eslint/config'
import lrs, { createLrsConfig } from 'lrs-eslint-plugin'
import type { LrsConfigOptions, LrsPlugin } from 'lrs-eslint-plugin'

type IsAny<Value> = 0 extends 1 & Value ? true : false
const _pluginIsTyped: IsAny<typeof lrs> = false
const _recommendedIsTyped: IsAny<typeof lrs.configs.recommended> = false

const _plugin: ESLint.Plugin = lrs
const _namedPluginType: LrsPlugin = lrs
const options: LrsConfigOptions = { root: '/project' }
const _presentationRule: Rule.RuleModule = lrs.rules['presentation-imports']
const _serviceRule: Rule.RuleModule = lrs.rules['service-imports']
const _viewRule: Rule.RuleModule = lrs.rules['one-view-per-folder']
const _recommended: Linter.Config[] = lrs.configs.recommended
const _application: Linter.Config[] = createLrsConfig(options)

const config = defineConfig(
  { plugins: { lrs } },
  ...lrs.configs.recommended,
  ...createLrsConfig({ root: '/project' }),
)

new ESLint({ overrideConfigFile: true, overrideConfig: config })

// @ts-expect-error A project root is required.
createLrsConfig()
// @ts-expect-error The options object must include a root.
createLrsConfig({})
// @ts-expect-error Project roots must be strings.
createLrsConfig({ root: 123 })
// @ts-expect-error Undefined roots are invalid under strictNullChecks.
createLrsConfig({ root: undefined })
// @ts-expect-error Unsupported options must not be silently accepted.
createLrsConfig({ root: '/project', unknownOption: true })
