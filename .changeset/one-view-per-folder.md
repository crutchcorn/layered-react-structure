---
'lrs-eslint-plugin': minor
---

Add `lrs/one-view-per-folder` to the recommended and combined configurations. Folders may contain at most one production `.view` source file; colocated tests and stories do not count. The rule checks sibling files even when linting a single file or an unsaved editor buffer.

Existing folders with multiple views now fail lint. Consolidate their orchestration and extract behavior into hooks, services, or utilities, or give independent views their own feature folders.
