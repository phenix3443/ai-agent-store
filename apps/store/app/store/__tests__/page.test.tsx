import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'

afterEach(() => { cleanup() })

mock.module('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))
mock.module('next/navigation', () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => '/store',
  useSearchParams: () => new URLSearchParams(),
}))
mock.module('next-intl', () => ({
  useLocale: () => 'zh',
  useTranslations: () => (key: string) => key.split('.').pop() ?? key,
}))

// The store page now fetches its catalog from the API server via @/lib/catalog.
// Back the mock with the offline mock catalog so the page renders deterministic
// data without hitting the network.
const {
  getItems: mockGetItems,
  getFeaturedItems: mockGetFeaturedItems,
} = await import('../../../lib/mock/items')
mock.module('@/lib/catalog', () => ({
  getItems: async (opts: Parameters<typeof mockGetItems>[0]) => mockGetItems(opts),
  getFeaturedItems: async () => mockGetFeaturedItems(),
}))

const { default: StorePage } = await import('../page')
const { ClientStateProvider } = await import('../../../components/ClientStateProvider')

describe('StorePage', () => {
  test('renders items from the mock catalog', async () => {
    render(<ClientStateProvider>{await StorePage({ searchParams: {} })}</ClientStateProvider>)
    // An item may appear in both the featured carousel and the grid, so allow >1.
    expect(screen.getAllByText('Superpowers').length).toBeGreaterThan(0)
  })

  test('filters by category search param', async () => {
    render(
      <ClientStateProvider>
        {await StorePage({ searchParams: { category: 'mcp' } })}
      </ClientStateProvider>
    )
    // The category filter drives the grid; both mcp items render.
    expect(screen.getAllByText('Filesystem MCP').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Web Search MCP').length).toBeGreaterThan(0)
  })
})
