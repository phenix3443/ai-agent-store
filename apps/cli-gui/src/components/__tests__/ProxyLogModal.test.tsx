import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import * as rpcModule from '../../lib/rpc'
import { ProxyLogModal } from '../ProxyLogModal'
import type { RecentRequestRow } from '@aas/types'

afterEach(() => { cleanup(); mock.restore() })

function row(overrides: Partial<RecentRequestRow>): RecentRequestRow {
  return {
    id: 1, createdAt: '2026-07-05T00:00:00Z', providerSlug: 'p1', target: 'claude', model: 'm1',
    inputTokens: 10, outputTokens: 5, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0.001,
    statusCode: 200, latencyMs: 500, isStreaming: false, isFallback: false,
    ...overrides,
  }
}

test('shows recent request rows including a fallback marker', async () => {
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string) => {
    if (method === 'getRecentRequests') {
      return [row({ id: 2, providerSlug: 'backup', isFallback: true }), row({ id: 1 })]
    }
    throw new Error(`unexpected RPC in ProxyLogModal test: ${method}`)
  }) as typeof rpcModule.callRpc)

  render(<ProxyLogModal open onOpenChange={() => {}} />)

  expect(await screen.findByText('p1')).toBeInTheDocument()
  expect(await screen.findByText(/backup.*（降级）/)).toBeInTheDocument()
})

test('does not fetch when closed', () => {
  const spy = spyOn(rpcModule, 'callRpc')
  render(<ProxyLogModal open={false} onOpenChange={() => {}} />)
  expect(spy).not.toHaveBeenCalled()
})
