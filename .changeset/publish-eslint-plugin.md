---
'lrs-eslint-plugin': patch
---

Prepare the ESLint plugin for public npm releases with GitHub Actions provenance.

Migrate the plugin to TypeScript and publish a tsdown-built ESM bundle with declarations for its rules, presets, and configuration options. Run TypeScript Vitest tests and packed-package consumer checks through Nx before release.
