# lrs-eslint-plugin

## 0.3.1

### Patch Changes

- 7c4311a: Allow type-only wildcard re-exports from React packages in utilities.

## 0.3.0

### Minor Changes

- c8ee568: Apply presentation import checks to component modules and keep components out of services.
- cca639b: Add an opt-in strict rule that keeps component folders focused on rendering.
- 5e79038: Add a recommended rule that prevents hooks from rendering React elements.
- 3e0351f: Skip test, spec, story, and test-support files in the recommended and strict boundary presets.
- a22f2a8: Block presentation and service modules from importing application `.logic` modules.
- 2bca51d: Keep network and browser-storage effects out of presentation and utility modules.
- 6f9a5ab: Let presentational components use presentation-safe hooks. A hook named with a
  `.ui` suffix, such as `src/hooks/use-disclosure.ui.ts`, may be imported from
  `.ui` files. The recommended configuration now applies `lrs/presentation-imports`
  to every `src/**/*.ui.*` source file, so these hooks are held to the same
  boundary and can't import application hooks, services, or TanStack packages.
  The folder structure policy accepts `use-*.ui.ts` hooks and their tests.

  `lrs/presentation-imports` also accepts an `allow` option for hooks that are
  safe for presentation. Each entry takes a `from` module, a list of `hooks`, or
  both, such as `{ from: 'src/hooks/use-theme', hooks: ['useTheme'] }`.

  Relative imports from a `.ui` file inside a `hooks/` or `services/` folder that
  stay within that folder now count as imports of that layer.

- 6cfcc4e: Add a recommended rule that keeps utilities independent of application and React runtime layers.
- 52db48a: Add a recommended rule that keeps DOM markup and styling out of view modules.
- 462ae3b: Allow applications to ignore framework-owned paths in the structure policy.

## 0.2.0

### Minor Changes

- f52d071: Add `lrs/feature-imports` to the recommended and combined configurations. Files under `src/**/views/<feature>/` may no longer import from a different `views/<other-feature>/` folder, whether through a relative path or an alias that exposes the `views` segment. Imports within the same feature and from the shared `src/` layers are still allowed.

  Existing cross-feature imports now fail lint. Move the shared hook, component, utility, service, or type to the matching `src/`-level layer and make it generic enough for every consumer.

## 0.1.0

### Minor Changes

- 177a74e: Add `lrs/one-logic-per-folder` to the recommended and combined configurations. Each folder may contain at most one `.logic.ts` file, independently of its `.view` file. Colocated tests and specs do not count. The rule checks sibling files even when linting a single file or an unsaved editor buffer.

  Existing folders with multiple `.logic.ts` files now fail lint. Keep one logic file and move further decomposition into that folder's `hooks/`. The strict application structure also accepts a feature-level `.logic.ts` file and its tests.

- ec8fec4: Add `lrs/one-view-per-folder` to the recommended and combined configurations. Folders may contain at most one production `.view` source file; colocated tests and stories do not count. The rule checks sibling files even when linting a single file or an unsaved editor buffer.

  Existing folders with multiple views now fail lint. Consolidate their orchestration and extract behavior into hooks, services, or utilities, or give independent views their own feature folders.

## 0.0.2

### Patch Changes

- 73985c2: Prepare the ESLint plugin for public npm releases with GitHub Actions provenance.

  Migrate the plugin to TypeScript and publish a tsdown-built ESM bundle with declarations for its rules, presets, and configuration options. Run TypeScript Vitest tests and packed-package consumer checks through Nx before release.
