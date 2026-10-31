import { mkdirSync, writeFileSync } from 'node:fs'
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

mkdirSync('src/views/people', { recursive: true })
writeFileSync('src/views/people/edit-person.view.js', '')
const [viewResult] = await eslint.lintText('export const people = []', {
  filePath: 'src/views/people/people.view.js',
})

writeFileSync('src/views/people/edit-person.logic.ts', '')
const [logicResult] = await eslint.lintText('export const people = []', {
  filePath: 'src/views/people/people.logic.ts',
})

const [featureResult] = await eslint.lintText(
  "import { usePeople } from '../people/hooks/use-people'",
  { filePath: 'src/views/chat/chat.view.js' },
)

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
    viewRuleIds: viewResult?.messages.map((message) => message.ruleId),
    logicRuleIds: logicResult?.messages.map((message) => message.ruleId),
    featureRuleIds: featureResult?.messages.map((message) => message.ruleId),
    structureRuleIds: structureResult?.messages.map(
      (message) => message.ruleId,
    ),
  }),
)
