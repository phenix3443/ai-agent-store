import { expect, test } from 'bun:test'
import { sanitizeCodexResponsesRequest } from '../agent-package-codex-relay'

test('sanitizeCodexResponsesRequest keeps only upstream-compatible fields', () => {
  expect(
    sanitizeCodexResponsesRequest({
      model: 'gpt-5.4',
      instructions: 'Use frontend-design skill.',
      input: [{ type: 'message', role: 'user', content: [] }],
      stream: true,
      tools: [{ type: 'function', name: 'exec_command' }],
      client_metadata: { thread_id: 't1' },
      prompt_cache_key: 'cache-key',
      reasoning: { effort: 'medium' },
    })
  ).toEqual({
    model: 'gpt-5.4',
    instructions: 'Use frontend-design skill.',
    input: [{ type: 'message', role: 'user', content: [] }],
    stream: true,
  })
})
