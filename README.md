# Layered React Structure

Layered React Structure (LRS) gives your React code a clear home: views coordinate business logic, presentational components handle UI, and services handle I/O.

Read [Scale Your Project with Layered React Structure](https://playfulprogramming.com/posts/layered-react-structure/) for the reasoning behind LRS and examples of how the layers fit together.

This repository contains tools for adopting and enforcing LRS. Use them together or independently:

| Tool                                                             | Purpose                                                                           |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Agent skill](skills/layered-react-structure/SKILL.md)           | Guide your coding agent when building, refactoring, or reviewing React features.  |
| [ESLint plugin](https://www.npmjs.com/package/lrs-eslint-plugin) | Check import boundaries and optionally enforce the LRS file and folder structure. |

## Install the skill

Run this from the project where you want to use it:

```sh
npx skills add crutchcorn/layered-react-structure --skill layered-react-structure
```

Choose your agent in the installer. Add `--global` to make the skill available across projects, or `--agent codex` to target a specific agent. See the [Skills CLI documentation](https://github.com/vercel-labs/skills#install-a-skill) for supported agents and options.

Then ask your agent:

> Use layered-react-structure to refactor the people feature. Separate business logic from presentation and keep feature-specific code together.

Or:

> Use layered-react-structure to review this React app's import boundaries. Point out misplaced code and show where it belongs.

The skill is self-contained. It doesn't require another skill, a specific router, or new application dependencies.

## Install the ESLint plugin

Install [`lrs-eslint-plugin` from npm](https://www.npmjs.com/package/lrs-eslint-plugin) with ESLint and a TypeScript/JSX parser from your React project's directory:

```sh
npm install --save-dev lrs-eslint-plugin 'eslint@^10.12.0' typescript-eslint
```

Use your project's package manager when adding the dependencies. The plugin ships a ready-to-use ESM bundle with TypeScript declarations; consumers need no build step.

Add the import-boundary rules to `eslint.config.mjs` in the application directory containing `src/`:

```js
import tseslint from 'typescript-eslint'
import lrs from 'lrs-eslint-plugin'

export default [...tseslint.configs.recommended, ...lrs.configs.recommended]
```

If you already have an ESLint configuration, keep its parser and rules and append `...lrs.configs.recommended`. Then run:

```sh
npx eslint src
```

The recommended configuration checks presentation imports in `src/**/*.ui.{tsx,jsx}` and service imports under `src/**/services/`. For optional TypeScript React file and folder enforcement, use the `createLrsConfig({ root })` preset described in the [plugin documentation](packages/eslint/README.md#optional-application-structure). That documentation also covers custom rule scopes and the limits of static import checks.

## Repository layout

- [`skills/`](skills/) contains installable agent skills.
- [`packages/`](packages/) contains reusable tools, including the ESLint plugin.
- [`examples/`](examples/) contains example applications.
- [`skills.sh.json`](skills.sh.json) organizes the repository's Skills.sh page, following the [customization format](https://www.skills.sh/docs/customize).

## Work with the skill locally

To check skill discovery from this checkout without installing it:

```sh
npx skills add . --list
```

To install this checkout's version locally:

```sh
npx skills add . --skill layered-react-structure
```

The GitHub install command uses the published repository contents. Push the skill files to the default branch before sharing that command. Skills.sh reads the page configuration after an installation with CLI telemetry enabled; the page may take time to refresh.

## Further reading and license

The skill adapts Corbin Crutchley's [Scale Your Project with Layered React Structure](https://raw.githubusercontent.com/playfulprogramming/playfulprogramming/refs/heads/main/content/crutchcorn/posts/layered-react-structure/index.md) into concise instructions, with clarifications for effect classification and framework boundaries. Read the article for the reasoning and extended examples.

The article and the skill adaptation are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
