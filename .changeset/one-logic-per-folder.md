---
'lrs-eslint-plugin': minor
---

Add `lrs/one-logic-per-folder` to the recommended and combined configurations. Each folder may contain at most one `.logic.ts` file, independently of its `.view` file. Colocated tests and specs do not count. The rule checks sibling files even when linting a single file or an unsaved editor buffer.

Existing folders with multiple `.logic.ts` files now fail lint. Keep one logic file and move further decomposition into that folder's `hooks/`. The strict application structure also accepts a feature-level `.logic.ts` file and its tests.
