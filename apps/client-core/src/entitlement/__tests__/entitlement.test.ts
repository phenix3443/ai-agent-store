import { test, expect, afterEach } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import {
  entitlementsForPlan,
  entitlementCachePath,
  readEntitlementCache,
  writeEntitlementCache,
  resolveEntitlements,
} from '../index'

let aasHome: string | undefined

afterEach(async () => {
  if (aasHome) await rm(aasHome, { recursive: true, force: true })
  aasHome = undefined
  delete process.env['AS_PLAN']
})

test('entitlementsForPlan gates all Pro features off for free', () => {
  expect(entitlementsForPlan('free')).toEqual({
    plan: 'free',
    advancedUsageAnalytics: false,
    smartRouting: false,
    keyRotation: false,
  })
})

test('entitlementsForPlan unlocks Pro features for pro and team', () => {
  for (const plan of ['pro', 'team'] as const) {
    expect(entitlementsForPlan(plan)).toEqual({
      plan,
      advancedUsageAnalytics: true,
      smartRouting: true,
      keyRotation: true,
    })
  }
})

test('writeEntitlementCache then readEntitlementCache round-trips the plan', async () => {
  aasHome = await mkdtemp('/tmp/as-entitlement-')
  await writeEntitlementCache(aasHome, 'pro')
  const cache = await readEntitlementCache(aasHome)
  expect(cache?.plan).toBe('pro')
  expect(typeof cache?.fetchedAt).toBe('string')
})

test('readEntitlementCache returns null for a missing or malformed cache', async () => {
  aasHome = await mkdtemp('/tmp/as-entitlement-')
  expect(await readEntitlementCache(aasHome)).toBeNull()
  await writeFile(entitlementCachePath(aasHome), JSON.stringify({ plan: 'enterprise' }))
  expect(await readEntitlementCache(aasHome)).toBeNull()
})

test('resolveEntitlements defaults to free when no cache exists', async () => {
  aasHome = await mkdtemp('/tmp/as-entitlement-')
  expect((await resolveEntitlements(aasHome)).plan).toBe('free')
})

test('resolveEntitlements reads the cached plan', async () => {
  aasHome = await mkdtemp('/tmp/as-entitlement-')
  await writeEntitlementCache(aasHome, 'pro')
  expect((await resolveEntitlements(aasHome)).advancedUsageAnalytics).toBe(true)
})

test('resolveEntitlements honors the AS_PLAN override above the cache', async () => {
  aasHome = await mkdtemp('/tmp/as-entitlement-')
  await writeEntitlementCache(aasHome, 'free')
  process.env['AS_PLAN'] = 'pro'
  expect((await resolveEntitlements(aasHome)).plan).toBe('pro')
})
