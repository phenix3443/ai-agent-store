import { test, expect } from 'bun:test'
import { computeRecommendedScore, DOWNLOADS_MAX, type ScoreInput } from '../scoring'

// computeRecommendedScore is the TS mirror of the ORDER BY SQL used by
// getItems(sort='recommended'). The SQL itself only runs in Postgres (the query
// layer is mocked in app.test.ts), so we assert the ranking behaviour here on
// the shared formula/constants instead of on exact score values.

const NOW = new Date('2026-07-14T00:00:00Z')
const RECENT = '2026-07-01T00:00:00Z' // ~13 days old
const OLD = '2025-07-14T00:00:00Z' // ~365 days old

function rank(items: (ScoreInput & { slug: string })[]): string[] {
  return [...items]
    .sort((a, b) => computeRecommendedScore(b, NOW) - computeRecommendedScore(a, NOW))
    .map((i) => i.slug)
}

test('a well-reviewed item outranks a lonely 5.0 when downloads are comparable', () => {
  // Same downloads/freshness/tier, so the rating factor decides.
  const lonely: ScoreInput & { slug: string } = {
    slug: 'lonely',
    downloads: 50_000,
    rating: 5,
    reviewCount: 1,
    updatedAt: RECENT,
    tier: 'community',
  }
  const solid: ScoreInput & { slug: string } = {
    slug: 'solid',
    downloads: 50_000,
    rating: 4.6,
    reviewCount: 500,
    updatedAt: RECENT,
    tier: 'community',
  }
  // Bayesian weighting collapses the 1-review 5.0 toward the prior mean, so the
  // consistently well-reviewed item wins despite its lower nominal rating.
  expect(rank([lonely, solid])).toEqual(['solid', 'lonely'])
})

test('freshness breaks ties: a recently updated item outranks an otherwise identical stale one', () => {
  const fresh: ScoreInput & { slug: string } = {
    slug: 'fresh',
    downloads: 10_000,
    rating: 4.5,
    reviewCount: 100,
    updatedAt: RECENT,
    tier: 'community',
  }
  const stale = { ...fresh, slug: 'stale', updatedAt: OLD }
  expect(rank([stale, fresh])).toEqual(['fresh', 'stale'])
})

test('tier breaks ties: an official publisher outranks an identical community one', () => {
  const official: ScoreInput & { slug: string } = {
    slug: 'official',
    downloads: 10_000,
    rating: 4.5,
    reviewCount: 100,
    updatedAt: RECENT,
    tier: 'official',
  }
  const community = { ...official, slug: 'community', tier: 'community' }
  expect(rank([community, official])).toEqual(['official', 'community'])
})

test('every factor is normalized to 0–1, so the total score stays within 0–1', () => {
  const best = computeRecommendedScore(
    { downloads: DOWNLOADS_MAX, rating: 5, reviewCount: 100_000, updatedAt: NOW.toISOString(), tier: 'official' },
    NOW
  )
  const worst = computeRecommendedScore(
    { downloads: 0, rating: 0, reviewCount: 0, updatedAt: OLD, tier: 'community' },
    NOW
  )
  expect(best).toBeLessThanOrEqual(1)
  expect(worst).toBeGreaterThanOrEqual(0)
  expect(best).toBeGreaterThan(worst)
})
