import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import * as rpcModule from '../../lib/rpc'
import { AppStateProvider } from '../../state/AppState'
import { Overview } from '../Overview'
import type { InstalledItem } from '@aas/types'

afterEach(() => { cleanup(); mock.restore() })

const providerItem: InstalledItem = {
  slug: 'p1', category: 'provider', version: '1.0.0', installedAt: '', updatedAt: '',
  compatibleWith: ['claude'], enabledFor: { claude: true },
}
const skillItem: InstalledItem = {
  slug: 's1', category: 'skill', version: '1.0.0', installedAt: '', updatedAt: '',
  compatibleWith: ['claude'], enabledFor: {},
}

test('shows a count card per category from the list RPC', async () => {
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string) => {
    if (method === 'list') return [providerItem, skillItem]
    if (method === 'getUsageSummary') return []
    if (method === 'getRelayStatus') return { running: false }
    if (method === 'listLocalConfigs') return []
    if (method === 'getRecentRequests') return []
    if (method === 'checkUpdates') return []
    throw new Error(`unexpected RPC in Overview test: ${method}`)
  }) as typeof rpcModule.callRpc)

  render(<AppStateProvider><Overview /></AppStateProvider>)

  expect(await screen.findByText('供应商')).toBeInTheDocument()
  expect(await screen.findByText('技能')).toBeInTheDocument()
  expect(await screen.findByText('MCP')).toBeInTheDocument()
})
