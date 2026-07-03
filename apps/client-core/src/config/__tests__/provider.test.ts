import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { readProviderConnection } from '../provider'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp('/tmp/aas-provider-test-')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

test('readProviderConnection returns undefined authType/modelMapping when absent', async () => {
  await writeFile(join(dir, 'config.json'), JSON.stringify({ apiKey: 'k', baseUrl: 'https://x.com' }))
  const conn = await readProviderConnection(dir)
  expect(conn.authType).toBeUndefined()
  expect(conn.modelMapping).toBeUndefined()
})

test('readProviderConnection reads a string authType', async () => {
  await writeFile(join(dir, 'config.json'), JSON.stringify({ apiKey: 'k', authType: 'anthropic' }))
  const conn = await readProviderConnection(dir)
  expect(conn.authType).toBe('anthropic')
})

test('readProviderConnection reads a custom-header authType', async () => {
  await writeFile(join(dir, 'config.json'), JSON.stringify({ apiKey: 'k', authType: { header: 'X-Custom-Key' } }))
  const conn = await readProviderConnection(dir)
  expect(conn.authType).toEqual({ header: 'X-Custom-Key' })
})

test('readProviderConnection reads modelMapping', async () => {
  await writeFile(join(dir, 'config.json'), JSON.stringify({
    apiKey: 'k',
    modelMapping: { 'claude-3-5-sonnet': 'gpt-4o', 'claude-*': 'gpt-4o-mini' },
  }))
  const conn = await readProviderConnection(dir)
  expect(conn.modelMapping).toEqual({ 'claude-3-5-sonnet': 'gpt-4o', 'claude-*': 'gpt-4o-mini' })
})

test('readProviderConnection ignores a malformed authType', async () => {
  await writeFile(join(dir, 'config.json'), JSON.stringify({ apiKey: 'k', authType: 42 }))
  const conn = await readProviderConnection(dir)
  expect(conn.authType).toBeUndefined()
})
