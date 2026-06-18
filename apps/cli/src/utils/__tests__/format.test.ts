import { test, expect } from 'bun:test'
import { formatDownloads, padEnd, formatTable, formatStep, SYMBOLS } from '../format'

test('SYMBOLS has correct values', () => {
  expect(SYMBOLS.enabled).toBe('✓')
  expect(SYMBOLS.disabled).toBe('✗')
  expect(SYMBOLS.update).toBe('↑')
})

test('formatDownloads: millions', () => {
  expect(formatDownloads(1_200_000)).toBe('1.2M')
  expect(formatDownloads(1_000_000)).toBe('1.0M')
  expect(formatDownloads(12_500_000)).toBe('12.5M')
})

test('formatDownloads: thousands', () => {
  expect(formatDownloads(12_000)).toBe('12K')
  expect(formatDownloads(1_000)).toBe('1K')
  expect(formatDownloads(999_999)).toBe('999.9K')
})

test('formatDownloads: small numbers', () => {
  expect(formatDownloads(999)).toBe('999')
  expect(formatDownloads(0)).toBe('0')
})

test('padEnd: pads short strings', () => {
  expect(padEnd('hi', 5)).toBe('hi   ')
})

test('padEnd: truncates long strings with ellipsis', () => {
  expect(padEnd('hello-world', 8)).toBe('hello-w…')
})

test('padEnd: exact length unchanged', () => {
  expect(padEnd('exact', 5)).toBe('exact')
})

test('formatTable: returns header + separator + rows', () => {
  const lines = formatTable(
    ['NAME', 'VERSION'],
    [['openai', '1.0.0']],
    [12, 10]
  )
  expect(lines).toHaveLength(3)
  expect(lines[0]).toContain('NAME')
  expect(lines[0]).toContain('VERSION')
  expect(lines[1]).toMatch(/^─+/)
  expect(lines[2]).toContain('openai')
})

test('formatStep: indents label and appends status', () => {
  const line = formatStep('Fetching foo...', 'done')
  expect(line).toMatch(/^\s{2}Fetching foo/)
  expect(line).toContain('done')
})

test('formatStep: no status when omitted', () => {
  const line = formatStep('Writing to ~/.agents/...')
  expect(line).not.toContain('done')
})
