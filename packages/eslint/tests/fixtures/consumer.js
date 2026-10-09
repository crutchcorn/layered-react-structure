import process from 'node:process'
import { ESLint } from 'eslint'
import { defineConfig } from 'eslint/config'
import lrs, { createLrsConfig } from 'lrs-eslint-plugin'

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: defineConfig(...lrs.configs.recommended),
})
const [result] = await eslint.lintText("import React from 'react'", {
  filePath: 'src/services/request.js',
})

// The combined configuration also loads the structure checker's runtime dependency.
const combined = new ESLint({
  overrideConfigFile: true,
  overrideConfig: defineConfig(...createLrsConfig({ root: process.cwd() })),
})
const [structureResult] = await combined.lintText('export const value = 1', {
  filePath: 'src/data/invalid.js',
})
// Return observations so Vitest can assert them without adding a test dependency
// to this isolated downstream consumer.
process.stdout.write(
  JSON.stringify({
    importRuleIds: result?.messages.map((message) => message.ruleId),
    structureRuleIds: structureResult?.messages.map(
      (message) => message.ruleId,
    ),
  }),
)
