import componentPlacement from './rules/component-placement.js'
import featureImports from './rules/feature-imports.js'
import hookRendering from './rules/hook-rendering.js'
import noApplicationIo from './rules/no-application-io.js'
import oneLogicPerFolder from './rules/one-logic-per-folder.js'
import oneViewPerFolder from './rules/one-view-per-folder.js'
import presentationImports from './rules/presentation-imports.js'
import serviceImports from './rules/service-imports.js'
import utilityImports from './rules/utility-imports.js'
import viewComposition from './rules/view-composition.js'

export const rules = {
  'one-logic-per-folder': oneLogicPerFolder,
  'one-view-per-folder': oneViewPerFolder,
  'component-placement': componentPlacement,
  'hook-rendering': hookRendering,
  'no-application-io': noApplicationIo,
  'feature-imports': featureImports,
  'presentation-imports': presentationImports,
  'service-imports': serviceImports,
  'utility-imports': utilityImports,
  'view-composition': viewComposition,
}
