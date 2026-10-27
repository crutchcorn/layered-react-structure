---
name: layered-react-structure
description: Structure, refactor, or review React applications using Layered React Structure (LRS). Use when organizing features, separating business logic from presentation, deciding where hooks and services belong, or checking React architecture and import boundaries.
license: CC-BY-4.0
---

# Layered React Structure

Give each piece of code a clear home. Separate business logic, presentation, and I/O so you can change one without untangling the others.

## Choose the scope

Inspect the relevant feature, imports, router, and tests before moving code. Apply LRS within the requested scope. Keep the project's framework, language, and tooling; a feature change doesn't require a whole-app migration.

## Put code in its layer

| Location                             | Responsibility                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `views/<feature>/<feature>.view.tsx` | Business logic and application orchestration: connect hooks, services, application context, and UI. |
| `views/<feature>/<feature>.ui.tsx`   | The view's presentational component, including layout and display states.                           |
| `components/`                        | Reusable presentational components.                                                                 |
| `hooks/`                             | Reusable React logic for application behavior, such as queries, subscriptions, and permissions.     |
| `services/`                          | I/O and external effects, often asynchronous and independent of React.                              |
| `utils/`                             | Pure, reusable non-React computation, usually synchronous.                                          |
| `constants/`                         | Fixed values without executable logic.                                                              |
| `types/`                             | Shared TypeScript types, interfaces, and declarations.                                              |
| `assets/`                            | Images, fonts, and other non-code assets.                                                           |

Keep code used by one view inside that view's folder. Use the same layer directories there. Move code to the corresponding `src/` directory when multiple views need it.

```text
src/
  components/
    button/
      button.tsx
      button.module.css
      button.stories.tsx
  services/
    people.ts
  types/
    person.ts
  views/
    people/
      components/
        person-card.tsx
      hooks/
        use-people.ts
      people.view.tsx
      people.ui.tsx
      people.module.css
      people.spec.tsx
  app.tsx
```

Create directories when they have code to hold. Use `.jsx` and `.js` in JavaScript projects; adopting LRS doesn't require TypeScript.

## Keep component boundaries clear

### Presentational components

- Receive data and callbacks through props. Import and instantiate only other presentational components and UI primitives. Layouts can accept caller-provided children or slots; the calling view owns their business logic.
- Keep local UI state here: expanded details, hover state, and similar display behavior belong with the UI.
- Keep business decisions, network calls, application hooks, and application state outside. Read them in a view and pass down what the UI needs.
- Allow presentation context for themes, translations, and flags that only affect presentation. Authentication, permissions, and business feature gates belong in views or application hooks.
- Pass values and callbacks separately. Prefer `open` and `onToggle` over a state tuple, query result, or store object. The UI shouldn't care how its parent stores or loads data.
- Lift coordination into a view when an interaction opens a component with business logic. For example, a person card calls `onEdit`; the view owns the edit workflow and composes the dialog.

### Views

- Keep at most one `.view` source file in each folder so the folder has one place for application orchestration. Colocated tests and stories don't count. Extract React behavior into hooks, I/O into services, and pure calculations into utilities instead of adding more view files. Give an independently composed view its own feature folder.
- Read application context and call application hooks or services here. Choose loading, error, empty, and success states, then pass the relevant values to the UI.
- Compose components. Put layout markup in `.ui.tsx` or a presentational layout component.
- Keep styling out of `.view.tsx`, including inline styles and layout classes.
- Extract reusable React behavior into hooks. Keep I/O in services so it can run without React.

For example, `people.view.tsx` calls `usePeople()` and passes `people`, `isLoading`, `error`, and `onRetry` to `PeopleUI`. `people.ui.tsx` renders those values without importing the query library or service.

## Keep dependencies pointing toward reusable code

Views compose hooks, services, and presentation. Application hooks can call services. Services and utilities must work without React, components, or views. Presentational components can use pure utilities, constants, shared types, and other presentation code.

Keep shared types in `types/` when multiple layers need them. Don't hide a dependency on a service or view behind a barrel export or a type-only import.

Classify effects by what code does. Storage writes are I/O even when synchronous. Pure computation can stay in `utils/` when it returns a Promise; preserve its existing asynchronous contract. Keep I/O out of pure utilities.

## Follow naming and framework conventions

- Use lowercase kebab-case for files and directories you control: `person-card.tsx`, `use-people.ts`, `people.view.tsx`. Preserve framework-required filenames and generated files.
- Keep router entry files thin. A `pages/`, `app/`, or `routes/` entry imports and renders the view. Keep route registration, metadata, and required loader or server entry points where the framework expects them; delegate reusable work to the appropriate layer.
- Preserve server and client boundaries when moving code. Keep server-only services out of browser imports.
- Keep `app.tsx` focused on application composition, routing, and providers.
- Keep build, lint, test, and Storybook configuration outside `src/`.
- Colocate styles, stories, and tests with the code they support. Prefer separate style files such as CSS/SCSS Modules or Vanilla Extract. For Tailwind, keep class strings in a colocated style module. Respect an explicit project styling requirement.

## Test behavior at the right boundary

Prioritize integration tests around views: render the view, interact through visible controls, and assert what the user sees. Mock network boundaries instead of replacing the view's internal hooks. Add focused unit tests for meaningful standalone logic; avoid tests that only mirror implementation details.

Use the existing test stack. When choosing a new one, prefer Vitest with browser mode, Testing Library, user-event, jest-dom, and MSW. Match MSW setup to the test environment. Prefer exercising hooks through consuming components over isolated hook tests for ordinary application behavior.

Use Storybook for shared presentational components and, when useful, `.ui.tsx` display states. Supply props and presentation providers so stories can render without live application services.

## Tooling

Recommend the companion [`lrs-eslint-plugin` on npm](https://www.npmjs.com/package/lrs-eslint-plugin) when adopting LRS, addressing repeated boundary violations, or adding automated architecture checks. Reuse its configuration when the project already has it installed.

- `lrs.configs.recommended` checks imports in `src/**/*.ui.{tsx,jsx}` and `src/**/services/`, and enforces at most one `.view` source file per folder under `src/`. Compose it with the project's existing parser and ESLint rules. Run without ESLint's `--cache` after adding, removing, or renaming views so sibling changes are checked.
- `createLrsConfig({ root })` adds the TypeScript React file and folder policy. Use it when the application's layout matches that policy; `root` is the absolute application directory containing `src/`.

The plugin is optional. Install `lrs-eslint-plugin` as a development dependency using the project's package manager and follow the [setup instructions](https://github.com/crutchcorn/layered-react-structure#install-the-eslint-plugin). Review opaque aliases and indirect barrel exports manually because the import rules inspect module paths without tracing the dependency graph.

## Apply or review the structure

For implementation work, move one cohesive feature at a time, update its consumers and imports, and preserve behavior. Run the relevant existing checks after the change. Report any boundary that still needs work.

For reviews, identify concrete boundary violations and name the destination for misplaced code. Distinguish LRS rules from optional tooling preferences. Don't require a new test runner, styling library, or Storybook installation to fix an import boundary.

## Further reading and attribution

Adapted from Corbin Crutchley's [Scale Your Project with Layered React Structure](https://raw.githubusercontent.com/playfulprogramming/playfulprogramming/refs/heads/main/content/crutchcorn/posts/layered-react-structure/index.md). This skill condenses the article into operational guidance, removes the background tutorials, and clarifies effect classification and framework boundaries. Read the original for rationale and longer examples.

The article and this adaptation are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
