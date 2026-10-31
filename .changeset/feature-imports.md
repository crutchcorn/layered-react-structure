---
'lrs-eslint-plugin': minor
---

Add `lrs/feature-imports` to the recommended and combined configurations. Files under `src/**/views/<feature>/` may no longer import from a different `views/<other-feature>/` folder, whether through a relative path or an alias that exposes the `views` segment. Imports within the same feature and from the shared `src/` layers are still allowed.

Existing cross-feature imports now fail lint. Move the shared hook, component, utility, service, or type to the matching `src/`-level layer and make it generic enough for every consumer.
