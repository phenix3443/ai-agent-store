import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { Entitlements, Plan } from '@as/types'

const PLANS: readonly Plan[] = ['free', 'pro', 'team']

function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value)
}

/** Maps a plan to its feature flags. Single source of truth for what each plan unlocks. */
export function entitlementsForPlan(plan: Plan): Entitlements {
  const paid = plan === 'pro' || plan === 'team'
  return {
    plan,
    advancedUsageAnalytics: paid,
    smartRouting: paid,
    keyRotation: paid,
  }
}

export interface EntitlementCache {
  plan: Plan
  fetchedAt: string
}

export function entitlementCachePath(aasHome: string): string {
  return join(aasHome, 'entitlement.json')
}

/** Reads the plan cached by the last successful auth fetch; null if absent or malformed. */
export async function readEntitlementCache(aasHome: string): Promise<EntitlementCache | null> {
  try {
    const parsed = JSON.parse(await readFile(entitlementCachePath(aasHome), 'utf-8')) as Partial<EntitlementCache>
    if (!isPlan(parsed.plan)) return null
    return { plan: parsed.plan, fetchedAt: typeof parsed.fetchedAt === 'string' ? parsed.fetchedAt : '' }
  } catch {
    return null
  }
}

/** Persists the resolved plan locally so entitlements survive going offline. Written by the auth fetch (Phase 2). */
export async function writeEntitlementCache(aasHome: string, plan: Plan): Promise<void> {
  await mkdir(aasHome, { recursive: true })
  const cache: EntitlementCache = { plan, fetchedAt: new Date().toISOString() }
  await writeFile(entitlementCachePath(aasHome), JSON.stringify(cache, null, 2))
}

/**
 * Resolves the current entitlements. Precedence:
 *   1. AS_PLAN env override (dev/testing only)
 *   2. Locally cached plan from the last successful auth fetch (offline-friendly)
 *   3. free (default)
 */
export async function resolveEntitlements(aasHome: string): Promise<Entitlements> {
  const override = process.env['AS_PLAN']
  if (isPlan(override)) return entitlementsForPlan(override)
  const cache = await readEntitlementCache(aasHome)
  return entitlementsForPlan(cache?.plan ?? 'free')
}
