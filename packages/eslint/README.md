# LRS ESLint rules

[`lrs-eslint-plugin`](https://www.npmjs.com/package/lrs-eslint-plugin) enforces the import boundaries in [Layered React Structure](https://playfulprogramming.com/posts/layered-react-structure). It is an ESM package with no build step.

Install it in your React project:

```sh
npm install --save-dev lrs-eslint-plugin 'eslint@^10.12.0' typescript-eslint
```

Compose its flat configuration after your application's parser configuration:

```js
import tseslint from 'typescript-eslint'
import lrs from 'lrs-eslint-plugin'

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...lrs.configs.recommended,
)
```

The consumer supplies its JavaScript/TypeScript parser and JSX configuration. Paths are relative to the consuming ESLint configuration, so a frontend config in `apps/frontend` applies the rules to that application's `src` directory. The plugin does not configure or replace `no-restricted-imports`; application-specific restrictions can run alongside these rules.

| Rule                       | Recommended files                                      | Disallowed dependencies                                                                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `lrs/presentation-imports` | `src/**/*.ui.{tsx,jsx}`                                | `services` and `hooks` path segments, `.view` components, all `@tanstack/*` packages          |
| `lrs/service-imports`      | `src/**/services/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}` | React and React DOM, `@tanstack/react-*`, `hooks` path segments, `.view` and `.ui` components |

Presentational components may import React, plain types, utilities, constants, and other presentation components. Services may import framework-independent tools such as `@tanstack/query-core`, other services, and plain types. Type-only imports are subject to the same boundaries: move shared types into a `types` module instead of importing them through a service or component.

The rules inspect static imports, re-exports, `import()` expressions, unshadowed `require()` calls, TypeScript import types, and TypeScript import-equals declarations. String literals and template literals without expressions are checked. Component imports are recognized with or without source/output extensions, including `.view.tsx` and `.ui.js`. Directory imports such as `../services`, Windows separators, and bundler query/fragment suffixes are also recognized.

This is a static specifier check, not an import-graph resolver. Computed module names and indirect exports from otherwise permitted barrels are not traced. Aliases must expose their layer in the module path (for example `@/services/chat`); an opaque alias such as `@chat-client` needs an application-specific restriction. Locally declared or parameter-bound functions named `require` are left alone.

To use different folder conventions, register the plugin and scope its individual rules explicitly:

```js
export default [
  {
    files: ['features/**/*.ui.tsx'],
    plugins: { lrs },
    rules: { 'lrs/presentation-imports': 'error' },
  },
]
```

Run `pnpm test:lib` for RuleTester and flat-configuration tests, and `pnpm test:eslint` to lint the package.

## Optional application structure

`createLrsConfig({ root })` combines the recommended import boundaries with a TypeScript React application's file and folder policy through [`eslint-plugin-project-structure`](https://github.com/Igorkowalski94/eslint-plugin-project-structure). Use this single preset for the full LRS policy. Applications that only need import boundaries can still use the default plugin's `configs.recommended` array shown above.

```js
import tseslint from 'typescript-eslint'
import { createLrsConfig } from 'lrs-eslint-plugin'

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...createLrsConfig({ root: import.meta.dirname }),
)
```

`root` must be the absolute application directory containing `src`; `import.meta.dirname` supplies it from the consuming ESLint config. The upstream plugin otherwise derives its root from its installation path, which resolves to the workspace root under pnpm and can silently skip an application's files. The factory scopes both the import rules and the folder checker to the explicit root, independently of the command's working directory. Configuration files, public assets, end-to-end tests outside `src`, and sibling applications are outside this policy.

| Location                         | Accepted contents                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `src`                            | Shared layers, `views`, `app.tsx`, `main.tsx`, their tests, `vite-env.d.ts`, and styles |
| `src/views/<feature>`            | `*.view.tsx`, `*.ui.tsx`, tests, stories, styles, `index.ts`, and feature layers        |
| `components`                     | Components (`*.tsx`, optionally `*.ui.tsx`), tests, stories, styles, and barrels        |
| `hooks`                          | `use-*.ts`, hook tests, and barrels                                                     |
| `services`, `constants`, `utils` | TypeScript modules, tests, and barrels                                                  |
| `types`                          | TypeScript modules and declarations such as `svg.d.ts`                                  |
| `services/schemas`               | Generated `*.d.ts` schemas and an optional barrel                                       |
| `assets`                         | Images, fonts, media, WebAssembly, and JSON                                             |

The same layer directories are available at the shared and feature level. Features, nested layer directories, and filenames use lowercase kebab case. Layer directories may be nested for related responsibilities; arbitrary directories directly under `src` or a feature are rejected. New features and modules do not require adding their names to the configuration.

Tests may use `.spec.ts`, `.test.ts`, `.spec.tsx`, or `.test.tsx`, including component role suffixes such as `results.ui.spec.tsx`. Stories use `.stories.tsx`. CSS, Sass, and Less can be colocated with components or features, including `*.module.css`. Production JSX belongs to views or components, with `app.tsx` and `main.tsx` as entry points. The `utils/testing-utils` directory also permits JSX render helpers and provider wrappers for tests.

The factory preserves the application's TypeScript/JavaScript parser and import rules. Its path-only parser applies to other extensions so CSS, SVG, unknown extensions, and extensionless files are checked too. Scope additional code-analysis configurations to their relevant code extensions, particularly rules that require TypeScript parser services.

The upstream plugin deduplicates folder diagnostics through a filesystem cache. This package isolates that cache in a temporary directory for each file and removes it after the check, so linting another file in the same invalid folder still reports an error. No project cache files or additional ignore entries are needed. The package tests exercise separate ESLint instances, non-code filesystem traversal, working-directory independence, and parser/import-rule composition.
