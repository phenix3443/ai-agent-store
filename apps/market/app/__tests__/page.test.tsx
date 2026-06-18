// apps/market/app/__tests__/page.test.tsx
import { test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'

function PlaceholderPage() {
  return (
    <main className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ray-fg">
        AI Agent Store
      </h1>
      <p className="mt-3 text-ray-fg-secondary">
        Discover and install AI providers, skills, and MCP servers.
      </p>
    </main>
  )
}

test('placeholder page renders heading', () => {
  render(<PlaceholderPage />)
  expect(screen.getByRole('heading', { name: 'AI Agent Store' })).toBeInTheDocument()
})

test('placeholder page renders tagline', () => {
  render(<PlaceholderPage />)
  expect(
    screen.getByText('Discover and install AI providers, skills, and MCP servers.')
  ).toBeInTheDocument()
})
