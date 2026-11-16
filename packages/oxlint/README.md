# Layered React Structure Oxlint plugin

Enforce Layered React Structure (LRS) in JavaScript and TypeScript with Oxlint.

## Setup

```sh
npm install --save-dev oxlint lrs-oxlint-plugin
```

Add an `oxlint.config.mjs` at the root of your application and extend the recommended preset.

```js
import { configs } from 'lrs-oxlint-plugin'

export default {
  extends: [configs.recommended],
}
```

Run `npx oxlint` from that directory. The preset uses the same rule IDs and file scopes as the [ESLint preset](https://github.com/crutchcorn/layered-react-structure/tree/main/packages/eslint).

To also enforce component placement, use `extends: [configs.recommended, configs.strict]`.

## Optional file and folder structure

Use `createLrsConfig` to apply the recommended rules and check paths against the LRS application layout.

```js
import { createLrsConfig } from 'lrs-oxlint-plugin'

export default {
  extends: [createLrsConfig({ root: import.meta.dirname })],
}
```

Keep the config in the application directory containing `src/` so the file patterns resolve from that directory. In a monorepo, put a config in each application directory where you want these rules.

Pass `ignorePatterns` to skip paths in the folder check while keeping the recommended rules active for those files.

Oxlint runs the folder check on JavaScript and TypeScript files. Use the [ESLint structure preset](https://github.com/crutchcorn/layered-react-structure/tree/main/packages/eslint#optional-application-structure) to check assets and other non-code paths.

## Configure individual rules

For a JSON config or custom file scopes, register the plugin with the `lrs` alias and enable the rules you want.

```json
{
  "jsPlugins": [{ "name": "lrs", "specifier": "lrs-oxlint-plugin" }],
  "overrides": [
    {
      "files": ["src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}"],
      "rules": { "lrs/service-imports": "error" }
    }
  ]
}
```
