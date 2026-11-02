import { ESLint } from 'eslint'
import type { Linter, Rule } from 'eslint'
import { defineConfig } from 'eslint/config'
import lrs, { createLrsConfig } from 'lrs-eslint-plugin'
import type { LrsConfigOptions, LrsPlugin } from 'lrs-eslint-plugin'

type IsAny<Value> = 0 extends 1 & Value ? true : false
const _pluginIsTyped: IsAny<typeof lrs> = false
const _recommendedIsTyped: IsAny<typeof lrs.configs.recommended> = false
const _strictIsTyped: IsAny<typeof lrs.configs.strict> = false

const _plugin: ESLint.Plugin = lrs
const _namedPluginType: LrsPlugin = lrs
const options: LrsConfigOptions = { root: '/project' }
const _featureRule: Rule.RuleModule = lrs.rules['feature-imports']
const _presentationRule: Rule.RuleModule = lrs.rules['presentation-imports']
const _serviceRule: Rule.RuleModule = lrs.rules['service-imports']
const _viewRule: Rule.RuleModule = lrs.rules['one-view-per-folder']
const _logicRule: Rule.RuleModule = lrs.rules['one-logic-per-folder']
const _componentRule: Rule.RuleModule = lrs.rules['component-placement']
const _noApplicationIoRule: Rule.RuleModule = lrs.rules['no-application-io']
const _recommended: Linter.Config[] = lrs.configs.recommended
const _strict: Linter.Config[] = lrs.configs.strict
const _application: Linter.Config[] = createLrsConfig(options)

const config = defineConfig(
  { plugins: { lrs } },
  ...lrs.configs.recommended,
  ...lrs.configs.strict,
  ...createLrsConfig({ root: '/project' }),
  {
    files: ['src/**/*.ui.tsx'],
    rules: {
      'lrs/presentation-imports': [
        'error',
        { allow: [{ from: 'src/hooks/use-theme', hooks: ['useTheme'] }] },
      ],
    },
  },
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
