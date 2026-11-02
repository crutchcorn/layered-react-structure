---
'lrs-eslint-plugin': minor
---

Let presentational components use presentation-safe hooks. A hook named with a
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
