import { test, expect, afterEach } from 'bun:test'
import { mkdtemp, rm } from 'fs/promises'
import {
  classifyOutcome,
  recordProviderHealthBatch,
  readProviderHealth,
  getCoolingProviderSlugs,
  resetProviderHealth,
} from '../provider-health'

let aasHome: string | undefined

afterEach(async () => {
  if (aasHome) await rm(aasHome, { recursive: true, force: true })
  aasHome = undefined
})

test('classifyOutcome maps status codes to error kinds', () => {
  expect(classifyOutcome(200)).toBeNull()
  expect(classifyOutcome(400)).toBeNull()
  expect(classifyOutcome(401)).toBe('auth')
  expect(classifyOutcome(403)).toBe('auth')
  expect(classifyOutcome(429)).toBe('rate_limit')
  expect(classifyOutcome(503)).toBe('overload')
  expect(classifyOutcome(529)).toBe('overload')
  expect(classifyOutcome(500)).toBe('server')
  expect(classifyOutcome(null)).toBe('network')
})

test('a single non-auth failure does not cool down (threshold is 2)', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 500, latencyMs: 10 }], now)
  const [row] = readProviderHealth(aasHome, now)
  expect(row.status).toBe('up')
  expect(row.consecutiveFailures).toBe(1)
  expect(row.cooldownUntil).toBeNull()
})

test('two consecutive server failures cool the provider down', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 500, latencyMs: 10 }], now)
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 500, latencyMs: 10 }], now)
  const [row] = readProviderHealth(aasHome, now)
  expect(row.status).toBe('cooling')
  expect(row.cooldownUntil).toBe(now + 30_000)
  expect(row.lastErrorKind).toBe('server')
  expect(getCoolingProviderSlugs(aasHome, now)).toEqual(new Set(['p1']))
})

test('an auth failure cools down immediately with a long TTL', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 401, latencyMs: 10 }], now)
  const [row] = readProviderHealth(aasHome, now)
  expect(row.status).toBe('cooling')
  expect(row.cooldownUntil).toBe(now + 10 * 60_000)
  expect(row.lastErrorKind).toBe('auth')
})

test('cooldown expires: a cooled provider reports up again after cooldownUntil', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 401, latencyMs: 10 }], now)
  const later = now + 10 * 60_000 + 1
  const [row] = readProviderHealth(aasHome, later)
  expect(row.status).toBe('up')
  expect(row.cooldownUntil).toBeNull()
  expect(getCoolingProviderSlugs(aasHome, later).size).toBe(0)
})

test('a success clears prior failure state', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 500, latencyMs: 10 }], now)
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 500, latencyMs: 10 }], now)
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 200, latencyMs: 10 }], now)
  const [row] = readProviderHealth(aasHome, now)
  expect(row.status).toBe('up')
  expect(row.consecutiveFailures).toBe(0)
  expect(row.cooldownUntil).toBeNull()
})

test('resetProviderHealth clears an active cooldown immediately', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  recordProviderHealthBatch(aasHome, [{ slug: 'p1', statusCode: 401, latencyMs: 10 }], now)
  expect(readProviderHealth(aasHome, now)[0].status).toBe('cooling')

  resetProviderHealth(aasHome, 'p1', now)
  const [row] = readProviderHealth(aasHome, now)
  expect(row.status).toBe('up')
  expect(row.consecutiveFailures).toBe(0)
  expect(row.cooldownUntil).toBeNull()
  expect(getCoolingProviderSlugs(aasHome, now).size).toBe(0)
})

test('a batch records each attempt independently per provider', async () => {
  aasHome = await mkdtemp('/tmp/as-health-')
  const now = 1_000_000
  // p1 fails over (network) then p2 succeeds — one request, two attempts.
  recordProviderHealthBatch(
    aasHome,
    [
      { slug: 'p1', statusCode: null, latencyMs: 5 },
      { slug: 'p2', statusCode: 200, latencyMs: 12 },
    ],
    now
  )
  const health = readProviderHealth(aasHome, now)
  const p1 = health.find((h) => h.providerSlug === 'p1')!
  const p2 = health.find((h) => h.providerSlug === 'p2')!
  expect(p1.consecutiveFailures).toBe(1)
  expect(p1.lastErrorKind).toBe('network')
  expect(p2.status).toBe('up')
})
