import { test, expect, afterEach } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { budgetConfigPath, readBudget, writeBudget, getBudgetStatus } from '../budget'
import { openUsageDb } from '../db'

let aasHome: string | undefined

afterEach(async () => {
  if (aasHome) await rm(aasHome, { recursive: true, force: true })
  aasHome = undefined
})

function seedRollup(home: string, date: string, costUsd: number) {
  const db = openUsageDb(home)
  db.run(
    `INSERT INTO daily_rollups (date, provider_slug, target, model, request_count, success_count, unpriced_request_count, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd)
     VALUES (?, 'p', 'claude', 'm', 1, 1, 0, 0, 0, 0, 0, ?)`,
    [date, costUsd]
  )
}

test('readBudget returns an unset budget when absent', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  expect(await readBudget(aasHome)).toEqual({ monthlyLimitUsd: null, alertThresholds: [0.8, 1] })
})

test('writeBudget normalizes a non-positive limit to null and round-trips', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  const written = await writeBudget(aasHome, { monthlyLimitUsd: 0, alertThresholds: [0.9] })
  expect(written.monthlyLimitUsd).toBeNull()
  const written2 = await writeBudget(aasHome, { monthlyLimitUsd: 100, alertThresholds: [0.9] })
  expect(written2).toEqual({ monthlyLimitUsd: 100, alertThresholds: [0.9] })
  expect((await readBudget(aasHome)).monthlyLimitUsd).toBe(100)
})

test('readBudget falls back to defaults on malformed json', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  await writeFile(budgetConfigPath(aasHome), 'not json')
  expect(await readBudget(aasHome)).toEqual({ monthlyLimitUsd: null, alertThresholds: [0.8, 1] })
})

test('getBudgetStatus sums only the current calendar month and projects to month end', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  const now = new Date(2026, 6, 10, 12, 0, 0) // 2026-07-10, 10 of 31 days elapsed
  seedRollup(aasHome, '2026-07-03', 5)
  seedRollup(aasHome, '2026-07-08', 15)
  seedRollup(aasHome, '2026-06-30', 999) // previous month — excluded
  await writeBudget(aasHome, { monthlyLimitUsd: 100, alertThresholds: [0.8, 1] })

  const status = await getBudgetStatus(aasHome, now)
  expect(status.spentUsd).toBe(20)
  expect(status.monthStart).toBe('2026-07-01')
  expect(status.fraction).toBeCloseTo(0.2, 5)
  expect(status.projectedUsd).toBeCloseTo((20 / 10) * 31, 5)
  expect(status.alertLevel).toBe('none')
})

test('getBudgetStatus flags warn past threshold and over past the limit', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  const now = new Date(2026, 6, 15, 12, 0, 0)
  seedRollup(aasHome, '2026-07-05', 85)
  await writeBudget(aasHome, { monthlyLimitUsd: 100, alertThresholds: [0.8, 1] })
  expect((await getBudgetStatus(aasHome, now)).alertLevel).toBe('warn')

  seedRollup(aasHome, '2026-07-06', 20) // total 105 > 100
  expect((await getBudgetStatus(aasHome, now)).alertLevel).toBe('over')
})

test('getBudgetStatus has null fraction and no alert when no limit set', async () => {
  aasHome = await mkdtemp('/tmp/as-budget-')
  const now = new Date(2026, 6, 15, 12, 0, 0)
  seedRollup(aasHome, '2026-07-05', 500)
  const status = await getBudgetStatus(aasHome, now)
  expect(status.monthlyLimitUsd).toBeNull()
  expect(status.fraction).toBeNull()
  expect(status.alertLevel).toBe('none')
  expect(status.projectedOverBudget).toBe(false)
})
