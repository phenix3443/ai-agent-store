import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { readProviderConnection } from '../provider'
import { duplicateProviderConnection } from '../provider'

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

test('duplicateProviderConnection copies manifest with new slug/id and appends a suffix to the name', async () => {
  const sourceDir = join(dir, 'source')
  const targetDir = join(dir, 'target')
  await mkdir(sourceDir, { recursive: true })
  await writeFile(join(sourceDir, 'manifest.json'), JSON.stringify({ id: 'yls', slug: 'yls', name: 'yls' }))
  await writeFile(join(sourceDir, 'config.json'), JSON.stringify({ apiKey: 'k', baseUrl: 'https://x.com' }))

  await duplicateProviderConnection(sourceDir, targetDir, 'yls-copy')

  const manifest = JSON.parse(await readFile(join(targetDir, 'manifest.json'), 'utf-8'))
  expect(manifest.slug).toBe('yls-copy')
  expect(manifest.id).toBe('yls-copy')
  expect(manifest.name).toBe('yls 副本')

  const config = JSON.parse(await readFile(join(targetDir, 'config.json'), 'utf-8'))
  expect(config).toEqual({ apiKey: 'k', baseUrl: 'https://x.com' })
})

test('duplicateProviderConnection writes an empty config.json when the source has none', async () => {
  const sourceDir = join(dir, 'source-no-config')
  const targetDir = join(dir, 'target-no-config')
  await mkdir(sourceDir, { recursive: true })
  await writeFile(join(sourceDir, 'manifest.json'), JSON.stringify({ id: 'yls', slug: 'yls', name: 'yls' }))

  await duplicateProviderConnection(sourceDir, targetDir, 'yls-copy-2')

  const config = JSON.parse(await readFile(join(targetDir, 'config.json'), 'utf-8'))
  expect(config).toEqual({})
})
