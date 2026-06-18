// apps/market/app/__tests__/page.test.tsx
// Mock @/lib/supabase/server (same level as items.test.ts) so each file
// establishes its own mock — avoids cross-file leakage in bun v1.3.12.
import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'

afterEach(() => { cleanup() })

const mockDBItem = {
  id: 'item-1',
  slug: 'test-agent',
  name: 'Test Agent',
  description: 'A test agent',
  readme_url: null,
  icon: '/icon.png',
  category: 'provider',
  version: '1.0.0',
  publisher_id: 'pub-1',
  compatible_with: ['claude'],
  tags: [],
  downloads: 500,
  rating: 0,
  status: 'published',
  install_hook: { steps: [] },
  metadata: { configSchema: {}, supportedModels: [] },
  created_at: '2026-06-18T00:00:00Z',
  updated_at: '2026-06-18T00:00:00Z',
  publishers: {
    id: 'pub-1',
    slug: 'test-publisher',
    name: 'Test Publisher',
    avatar_url: '/avatar.png',
    tier: 'official',
    bio: null,
    created_at: '2026-06-18T00:00:00Z',
  },
}

function makeQueryMock(data: unknown[]) {
  const q: any = {
    select: () => q,
    eq: () => q,
    ilike: () => q,
    order: () => q,
    range: () => q,
    limit: () => Promise.resolve({ data, error: null }),
    then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data, error: null }),
  }
  return q
}

mock.module('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => makeQueryMock([mockDBItem]),
  }),
}))

const { default: HomePage } = await import('../page')

describe('HomePage', () => {
  test('renders the hero heading', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 1, name: 'AI Agent Store' })).toBeInTheDocument()
  })

  test('renders Featured and New section headings', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 2, name: 'Featured' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'New' })).toBeInTheDocument()
  })

  test('renders items from query results', async () => {
    render(await HomePage())
    expect(screen.getAllByText('Test Agent').length).toBeGreaterThan(0)
  })
})
