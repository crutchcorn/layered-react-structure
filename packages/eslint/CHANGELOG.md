# lrs-eslint-plugin

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
