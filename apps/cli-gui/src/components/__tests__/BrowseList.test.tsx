import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { TerminalLogProvider } from '../../state/TerminalLog'
import * as rpcModule from '../../lib/rpc'

afterEach(() => { cleanup(); mock.restore() })

const searchResult = [{
  id: 'item-1', slug: 'openai-provider', name: 'OpenAI Provider', description: 'GPT-4o',
  readmeUrl: '', icon: '', category: 'provider', version: '1.2.0',
  publisher: { id: 'p', slug: 'openai', name: 'OpenAI', avatarUrl: '', tier: 'official' },
  compatibleWith: ['claude'], tags: [], downloads: 10, rating: 4.5,
  status: 'published', installHook: { steps: [] },
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  configSchema: {}, supportedModels: ['gpt-4o'],
}]

function mockRpc(handlers: Record<string, (...args: unknown[]) => unknown>) {
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string, args: unknown[] = []) =>
    handlers[method]?.(...args)) as typeof rpcModule.callRpc)
}

async function renderBrowse() {
  const { BrowseList } = await import('../BrowseList')
  return render(
    <TerminalLogProvider>
      <BrowseList />
    </TerminalLogProvider>
  )
}

test('searching renders matching results', async () => {
  mockRpc({ search: () => searchResult })
  await renderBrowse()
  fireEvent.change(screen.getByPlaceholderText('搜索资源…'), { target: { value: 'openai' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => expect(screen.getByText('OpenAI Provider')).toBeInTheDocument())
})

test('clicking install calls the install RPC', async () => {
  const install = mock(() => ({ slug: 'openai-provider', version: '1.2.0', installedAt: '2026-01-01T00:00:00Z' }))
  mockRpc({ search: () => searchResult, install })
  await renderBrowse()
  fireEvent.change(screen.getByPlaceholderText('搜索资源…'), { target: { value: 'openai' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => screen.getByText('OpenAI Provider'))
  fireEvent.click(screen.getByText('安装'))
  await waitFor(() => expect(install).toHaveBeenCalledWith('openai-provider'))
})
