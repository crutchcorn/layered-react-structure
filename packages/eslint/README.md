# LRS ESLint rules

[`lrs-eslint-plugin`](https://www.npmjs.com/package/lrs-eslint-plugin) enforces the import boundaries in [Layered React Structure](https://playfulprogramming.com/posts/layered-react-structure). It ships an ESM bundle and TypeScript declarations built with [tsdown](https://tsdown.dev/). Consumers can use it directly without a build step.

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

From the repository root, run `pnpm nx test:lib lrs-eslint-plugin` for the TypeScript Vitest suite, including RuleTester, flat-configuration, and packed-package consumer tests. Nx builds the plugin first. Run `pnpm nx test:types lrs-eslint-plugin` to typecheck the source and tests, and `pnpm nx test:eslint lrs-eslint-plugin` to lint the package.

The declarations cover the default plugin, `configs.recommended`, both rules, and `createLrsConfig`. The package also exports the `LrsPlugin` and `LrsConfigOptions` types. Strict consumer checks verify the published declarations with NodeNext and Bundler module resolution.

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

## Build and release

Use the Node.js version in `.nvmrc` and the repository's pinned pnpm version. After `pnpm install`, run `pnpm test` from the repository root to run lint, formatting, strict typechecks, Vitest, and builds through Nx. `pnpm nx build lrs-eslint-plugin` produces `dist/index.js` and `dist/index.d.ts`; only `dist` and npm's standard package metadata/documentation are published. ESLint and the folder-structure plugin remain external dependencies.

`pnpm --filter lrs-eslint-plugin pack --pack-destination /tmp` builds through `prepack` before creating a tarball. The test suite also unpacks a tarball into an isolated consumer and verifies that its runtime and declarations work without access to this package's source or development dependencies.

Add a Changeset with `pnpm changeset` for release changes. The GitHub Actions release workflow creates a version pull request; after it is merged, it checks and packs the versioned package before publishing with npm provenance. Plugin metadata takes its name and version from `package.json` at build time.

An npm maintainer must configure a trusted publisher for `crutchcorn/layered-react-structure`, workflow `release.yml`, with permission for direct `npm publish`. If the package does not exist on npm yet, publish the initial version from an authenticated maintainer environment first. See the [Changesets trusted publishing guide](https://changesets.dev/guide/versioning-and-publishing#trusted-publishing) and [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
