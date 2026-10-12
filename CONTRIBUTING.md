# Contributing

Use Node.js 24 (see `.nvmrc`) and the pnpm version in `package.json`, then install dependencies:

```sh
pnpm install --frozen-lockfile
```

Run the repository checks with `pnpm test`.

## Evaluate the LRS skill

The [Promptfoo configuration](promptfooconfig.js) evaluates architecture guidance using the current [`SKILL.md`](skills/layered-react-structure/SKILL.md) from this checkout. It loads that file for every new run; there is no copied skill prompt to keep in sync.

Copy `.env.example` to the gitignored root `.env` file and set `EVAL_API_KEY` to your OpenAI API key. `EVAL_MODEL` selects the response model and defaults to `gpt-6.1-sol` when empty. Then run:

```sh
pnpm eval:skill
pnpm eval:skill:view
```

The grader uses the same model unless you set `EVAL_GRADER_MODEL`. Both use the Responses API with low reasoning effort. An uncached run makes ten response calls and ten grading calls, excluding retries. Both use your OpenAI API account and incur API charges. The package scripts store results, cache, and logs in the gitignored `.promptfoo/` directory; sharing is disabled in the configuration.

The [ten cases](evals/lrs/cases.yaml) cover scope and existing tooling, presentation state and context, business dialog ownership, effect classification, type and barrel imports, local versus shared code, server/client boundaries, behavioral tests, styling exceptions, and the ESLint plugin's scope. Each rubric checks architectural decisions and accepts equivalent valid implementations rather than matching keywords.

These are prompt-level adherence evals. They do not test skill discovery, tool use, actual file edits, compilation, or runtime behavior. Grading is model-based and can vary, so inspect the response and grader's explanation before treating a failure as a skill regression.

### Choose a smaller run or different models

Promptfoo's [CLI options](https://www.promptfoo.dev/docs/usage/command-line/) pass through the package script:

```sh
# Try one case first.
pnpm eval:skill --filter-first-n 1

# Select cases by their description.
pnpm eval:skill --filter-pattern 'effects'

# Override the response model and grader independently.
EVAL_MODEL=gpt-6.1-sol EVAL_GRADER_MODEL=gpt-6-sol pnpm eval:skill

# Bypass cached responses and save an ignored JSON report.
mkdir -p evals/results
pnpm eval:skill --no-cache --output evals/results/lrs.json
```

Use the same models and cases when comparing skill revisions. New skill contents change the rendered prompt; `--no-cache` also forces fresh responses and grading. For repeatability across model updates, use model snapshot IDs supported by your provider. Choose models that support the configured Responses API and reasoning settings, or adjust the provider configuration. Shell variables take precedence over the root `.env` file. Prefer the model variables above: Promptfoo's `--providers` and `--grader` replace entire provider configurations, including the `EVAL_API_KEY` mapping, so those overrides need their own authentication settings.

### Validate and extend the suite

```sh
pnpm test:evals
```

This credential-free check validates the Promptfoo configuration and test-case schemas. CI runs it without making model requests. It does not measure skill quality; run `pnpm eval:skill` with API credentials for scored results.

Add scenarios to `evals/lrs/cases.yaml` with a clear `description`, a self-contained `vars.task`, and an `llm-rubric` assertion. Include enough code and project context for the assistant to decide without repository tools. Describe the required decisions and unacceptable regressions in the rubric, including `{{task}}` so the grader can see the request. Keep expected answers out of the target prompt. See Promptfoo's [getting-started guide](https://www.promptfoo.dev/docs/getting-started/) and [rubric documentation](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/) for configuration details.
