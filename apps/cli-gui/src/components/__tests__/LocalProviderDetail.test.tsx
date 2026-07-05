import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import * as rpcModule from '../../lib/rpc'
import { AppStateProvider } from '../../state/AppState'
import { LocalProviderDetail, LOCAL_PROVIDER_SENTINEL } from '../LocalProviderDetail'

afterEach(() => { cleanup(); mock.restore() })

function mockRpc(overrides: Record<string, (args?: unknown[]) => unknown> = {}) {
  const configs = [
    { id: 'default', name: '默认', port: 18780, enabled: true },
    { id: 'extra', name: '测试环境', port: 18880, enabled: false },
  ]
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string, args?: unknown[]) => {
    if (overrides[method]) return overrides[method](args)
    if (method === 'listLocalConfigs') return configs
    if (method === 'getRelayStatus') return { running: true, pid: 123 }
    if (method === 'getRecentRequests') return []
    throw new Error(`unexpected RPC in LocalProviderDetail test: ${method}`)
  }) as typeof rpcModule.callRpc)
}

test('parent view shows aggregate stats: address, config count, running count', async () => {
  mockRpc()
  render(<AppStateProvider><LocalProviderDetail selectedSlug={LOCAL_PROVIDER_SENTINEL} /></AppStateProvider>)
  expect(await screen.findByText('local')).toBeInTheDocument()
  expect(await screen.findByText('内置 Provider')).toBeInTheDocument()
  expect(await screen.findByText('127.0.0.1')).toBeInTheDocument()
  expect(await screen.findByText(/2 个配置/)).toBeInTheDocument()
  expect(await screen.findByText(/1 个运行中/)).toBeInTheDocument()
})

test('child view shows a breadcrumb, a toggle switch, and an editable port field', async () => {
  mockRpc()
  render(<AppStateProvider><LocalProviderDetail selectedSlug={`${LOCAL_PROVIDER_SENTINEL}:default`} /></AppStateProvider>)
  await waitFor(() => expect(screen.getByText('local')).toBeInTheDocument())
  expect(screen.getByText('默认')).toBeInTheDocument()
  expect(screen.getByRole('switch')).toBeInTheDocument()
  expect(screen.getByDisplayValue('18780')).toBeInTheDocument()
})

test('toggling the child view switch calls toggleLocalConfig', async () => {
  let toggledId: string | undefined
  mockRpc({ toggleLocalConfig: (args) => { toggledId = args?.[0] as string; return { id: 'default', name: '默认', port: 18780, enabled: false } } })
  render(<AppStateProvider><LocalProviderDetail selectedSlug={`${LOCAL_PROVIDER_SENTINEL}:default`} /></AppStateProvider>)
  fireEvent.click(await screen.findByRole('switch'))
  await waitFor(() => expect(toggledId).toBe('default'))
})

test('editing the port field in the child view calls updateLocalConfig', async () => {
  let updatedPort: number | undefined
  mockRpc({
    updateLocalConfig: (args) => {
      updatedPort = (args?.[1] as { port?: number })?.port
      return { id: 'default', name: '默认', port: 19999, enabled: true }
    },
  })
  render(<AppStateProvider><LocalProviderDetail selectedSlug={`${LOCAL_PROVIDER_SENTINEL}:default`} /></AppStateProvider>)
  const portInput = await screen.findByDisplayValue('18780')
  fireEvent.change(portInput, { target: { value: '19999' } })
  await waitFor(() => expect(updatedPort).toBe(19999))
})

test('parent view opens the proxy log modal from 查看代理日志', async () => {
  mockRpc()
  render(<AppStateProvider><LocalProviderDetail selectedSlug={LOCAL_PROVIDER_SENTINEL} /></AppStateProvider>)
  fireEvent.click(await screen.findByText('查看代理日志'))
  expect(await screen.findByText('代理请求日志')).toBeInTheDocument()
})
