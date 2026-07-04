import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import * as rpcModule from '../../lib/rpc'
import { LocalRelayDetail } from '../LocalRelayDetail'

afterEach(() => { cleanup(); mock.restore() })

function mockRpc(overrides: Record<string, (args?: unknown[]) => unknown> = {}) {
  const configs = [{ id: 'default', name: '默认', port: 18780, enabled: true }]
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string, args?: unknown[]) => {
    if (overrides[method]) return overrides[method](args)
    if (method === 'listLocalConfigs') return configs
    if (method === 'getRelayStatus') return { running: true, pid: 123 }
    if (method === 'getRecentRequests') return []
    throw new Error(`unexpected RPC in LocalRelayDetail test: ${method}`)
  }) as typeof rpcModule.callRpc)
}

test('lists existing configs with name, port, and enabled state', async () => {
  mockRpc()
  render(<LocalRelayDetail />)
  expect(await screen.findByDisplayValue('默认')).toBeInTheDocument()
  expect(await screen.findByDisplayValue('18780')).toBeInTheDocument()
  expect(await screen.findByText(/运行中/)).toBeInTheDocument()
})

test('adding a config calls addLocalConfig and refreshes the list', async () => {
  let added = false
  mockRpc({
    addLocalConfig: () => { added = true; return { id: 'new', name: '新配置', port: 18880, enabled: true } },
  })
  render(<LocalRelayDetail />)
  await screen.findByDisplayValue('默认')
  fireEvent.click(screen.getByRole('button', { name: '新增配置' }))
  await waitFor(() => expect(added).toBe(true))
})

test('toggling a config calls toggleLocalConfig', async () => {
  let toggledId: string | undefined
  mockRpc({
    toggleLocalConfig: (args) => { toggledId = args?.[0] as string; return { id: 'default', name: '默认', port: 18780, enabled: false } },
  })
  render(<LocalRelayDetail />)
  const toggle = await screen.findByRole('button', { name: /启用状态/ })
  fireEvent.click(toggle)
  await waitFor(() => expect(toggledId).toBe('default'))
})

test('removing a config calls removeLocalConfig', async () => {
  let removedId: string | undefined
  mockRpc({
    listLocalConfigs: () => [
      { id: 'default', name: '默认', port: 18780, enabled: true },
      { id: 'extra', name: '额外', port: 18880, enabled: true },
    ],
    removeLocalConfig: (args) => { removedId = args?.[0] as string; return undefined },
  })
  render(<LocalRelayDetail />)
  await screen.findByDisplayValue('额外')
  const removeButtons = screen.getAllByRole('button', { name: '删除' })
  fireEvent.click(removeButtons[removeButtons.length - 1]!)
  await waitFor(() => expect(removedId).toBe('extra'))
})

test('clicking 查看代理日志 opens the proxy log modal', async () => {
  mockRpc()
  render(<LocalRelayDetail />)
  await screen.findByDisplayValue('默认')
  fireEvent.click(screen.getByRole('button', { name: '查看代理日志' }))
  expect(await screen.findByText('代理请求日志')).toBeInTheDocument()
})
