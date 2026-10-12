import { env } from 'node:process'

const model = env.EVAL_MODEL || 'gpt-6.1-sol'
const graderModel = env.EVAL_GRADER_MODEL || model

/** @type {import('promptfoo').TestSuiteConfig} */
export default {
  description: 'LRS skill architecture guidance',
  prompts: [{ id: 'file://evals/lrs/prompt.json', label: 'LRS skill' }],
  providers: [
    {
      id: `openai:responses:${model}`,
      config: {
        apiKeyEnvar: 'EVAL_API_KEY',
        reasoning: { effort: 'low' },
        max_output_tokens: 8192,
        store: false,
      },
    },
  ],
  defaultTest: {
    vars: {
      skill: 'file://skills/layered-react-structure/SKILL.md',
    },
    options: {
      provider: {
        id: `openai:responses:${graderModel}`,
        config: {
          apiKeyEnvar: 'EVAL_API_KEY',
          reasoning: { effort: 'low' },
          max_output_tokens: 4096,
          store: false,
        },
      },
    },
  },
  tests: 'file://evals/lrs/cases.yaml',
  evaluateOptions: { maxConcurrency: 2 },
  sharing: false,
}
