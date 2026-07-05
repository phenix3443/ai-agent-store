import { test, expect, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import * as rpcModule from '../rpc'
import { AppStateProvider, useAppState } from '../../state/AppState'
import { useSelectedDetail } from '../useSelectedDetail'

afterEach(() => { cleanup(); mock.restore() })

function Select({ slug }: { slug: string }) {
  const { setSelectedSlug } = useAppState()
  return <button onClick={() => setSelectedSlug(slug)}>select</button>
}

function Probe() {
  const detail = useSelectedDetail()
  return <span>{detail ? 'has-detail' : 'no-detail'}</span>
}

test('returns null immediately for a local-provider sentinel slug, without calling any RPC', async () => {
  const calls: string[] = []
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string) => {
    calls.push(method)
    throw new Error('should not be called')
  }) as typeof rpcModule.callRpc)

  render(
    <AppStateProvider>
      <Select slug="__local__" />
      <Probe />
    </AppStateProvider>
  )

  screen.getByText('select').click()

  expect(await screen.findByText('no-detail')).toBeInTheDocument()
  expect(calls).toEqual([])
})
