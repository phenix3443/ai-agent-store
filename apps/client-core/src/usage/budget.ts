import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { BudgetConfig, BudgetStatus } from '@as/types'
import { openUsageDb } from './db'

const DEFAULT_THRESHOLDS = [0.8, 1]

export function budgetConfigPath(aasHome: string): string {
  return join(aasHome, 'budget.json')
}

function normalizeLimit(value: unknown): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

function normalizeThresholds(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_THRESHOLDS
  const nums = value.filter((t): t is number => typeof t === 'number' && t > 0)
  return nums.length > 0 ? nums.sort((a, b) => a - b) : DEFAULT_THRESHOLDS
}

/** Reads the budget config; returns an unset budget (null limit) when absent or malformed. */
export async function readBudget(aasHome: string): Promise<BudgetConfig> {
  try {
    const raw = JSON.parse(await readFile(budgetConfigPath(aasHome), 'utf-8')) as Record<string, unknown>
    return {
      monthlyLimitUsd: normalizeLimit(raw['monthlyLimitUsd']),
      alertThresholds: normalizeThresholds(raw['alertThresholds']),
    }
  } catch {
    return { monthlyLimitUsd: null, alertThresholds: DEFAULT_THRESHOLDS }
  }
}

/** Persists the budget config and returns the normalized value that was written. */
export async function writeBudget(aasHome: string, config: BudgetConfig): Promise<BudgetConfig> {
  await mkdir(aasHome, { recursive: true })
  const normalized: BudgetConfig = {
    monthlyLimitUsd: normalizeLimit(config.monthlyLimitUsd),
    alertThresholds: normalizeThresholds(config.alertThresholds),
  }
  await writeFile(budgetConfigPath(aasHome), JSON.stringify(normalized, null, 2))
  return normalized
}

function monthStartOf(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/** Sums cost_usd from daily rollups on or after the given YYYY-MM-DD date. */
export function getSpendSince(aasHome: string, sinceDate: string): number {
  const db = openUsageDb(aasHome)
  const row = db
    .query(`SELECT COALESCE(SUM(cost_usd), 0) AS total FROM daily_rollups WHERE date >= ?`)
    .get(sinceDate) as { total: number }
  return row.total
}

/** Computes current-month spend against the budget, with a linear month-end projection and alert level. */
export async function getBudgetStatus(aasHome: string, now: Date = new Date()): Promise<BudgetStatus> {
  const config = await readBudget(aasHome)
  const monthStart = monthStartOf(now)
  const spentUsd = getSpendSince(aasHome, monthStart)
  const limit = config.monthlyLimitUsd

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const projectedUsd = dayOfMonth > 0 ? (spentUsd / dayOfMonth) * daysInMonth : spentUsd

  const fraction = limit != null ? spentUsd / limit : null
  const warnThreshold = Math.max(...config.alertThresholds.filter((t) => t < 1), 0.8)

  let alertLevel: BudgetStatus['alertLevel'] = 'none'
  if (limit != null) {
    if (spentUsd >= limit) alertLevel = 'over'
    else if (fraction != null && fraction >= warnThreshold) alertLevel = 'warn'
  }

  return {
    monthlyLimitUsd: limit,
    spentUsd,
    monthStart,
    fraction,
    projectedUsd,
    projectedOverBudget: limit != null && projectedUsd > limit,
    alertLevel,
  }
}
