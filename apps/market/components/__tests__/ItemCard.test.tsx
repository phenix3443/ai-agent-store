import { test, expect, mock, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import type { Item } from '@aas/types'

afterEach(() => { cleanup() })

// Mock next/link — it uses Node internals unavailable in happy-dom
mock.module('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

import { ItemCard } from '../ItemCard'

const mockItem: Item = {
  id: 'item-1',
  slug: 'openai-provider',
  name: 'OpenAI Provider',
  description: 'OpenAI API provider with GPT-4o support',
  readmeUrl: 'https://example.com/readme',
  icon: 'https://example.com/icon.png',
  category: 'provider',
  version: '1.2.0',
  publisher: {
    id: 'pub-1',
    slug: 'openai',
    name: 'OpenAI',
    avatarUrl: 'https://example.com/avatar.png',
    tier: 'official',
  },
  compatibleWith: ['claude', 'codex'],
  tags: ['ai', 'openai'],
  downloads: 1_200_000,
  rating: 0,
  status: 'published',
  installHook: { steps: [] },
  createdAt: '2026-06-18T00:00:00Z',
  updatedAt: '2026-06-18T00:00:00Z',
  configSchema: {},
  supportedModels: ['gpt-4o'],
}

test('ItemCard renders item name', () => {
  render(<ItemCard item={mockItem} />)
  expect(screen.getByText('OpenAI Provider')).toBeInTheDocument()
})

test('ItemCard renders description', () => {
  render(<ItemCard item={mockItem} />)
  expect(screen.getByText('OpenAI API provider with GPT-4o support')).toBeInTheDocument()
})

test('ItemCard renders formatted downloads: 1.2M', () => {
  render(<ItemCard item={mockItem} />)
  expect(screen.getByText('1.2M installs')).toBeInTheDocument()
})

test('ItemCard renders 999 downloads without abbreviation', () => {
  render(<ItemCard item={{ ...mockItem, downloads: 999 }} />)
  expect(screen.getByText('999 installs')).toBeInTheDocument()
})

test('ItemCard renders 1500 downloads as 1.5K', () => {
  render(<ItemCard item={{ ...mockItem, downloads: 1500 }} />)
  expect(screen.getByText('1.5K installs')).toBeInTheDocument()
})

test('ItemCard links to correct detail page', () => {
  render(<ItemCard item={mockItem} />)
  const link = screen.getByRole('link')
  expect(link.getAttribute('href')).toBe('/store/provider/openai-provider')
})

test('ItemCard renders compat tools', () => {
  render(<ItemCard item={mockItem} />)
  expect(screen.getByText('claude · codex')).toBeInTheDocument()
})
