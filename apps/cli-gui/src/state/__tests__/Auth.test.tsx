import { test, expect, afterEach, mock, spyOn } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import * as rpcModule from '../../lib/rpc'

const openMock = mock(async () => {})
mock.module('../../lib/openExternal', () => ({ openExternal: openMock }))
mock.module('../../lib/deepLink', () => ({ onDeepLink: async () => () => {} }))

const signInWithOAuth = mock(async () => ({ data: { url: 'https://github.com/login/oauth?x=1' }, error: null }))
const exchangeCodeForSession = mock(async () => ({ data: {}, error: null }))
const signOut = mock(async () => ({ error: null }))
const getSession = mock(async () => ({ data: { session: null } }))
const onAuthStateChange = mock(() => ({ data: { subscription: { unsubscribe: () => {} } } }))
const fakeClient = { auth: { getSession, onAuthStateChange, signInWithOAuth, exchangeCodeForSession, signOut } }
mock.module('../../lib/supabase', () => ({
  getSupabaseClient: () => fakeClient,
  AUTH_REDIRECT_URL: 'agent-store://auth-callback',
}))

const { AuthProvider, useAuth } = await import('../Auth')
const { EntitlementProvider } = await import('../Entitlement')

afterEach(() => {
  cleanup()
  mock.restore()
  openMock.mockClear()
  signInWithOAuth.mockClear()
  exchangeCodeForSession.mockClear()
})

function Probe() {
  const { signIn, completeSignIn, configured } = useAuth()
  return (
    <div>
      <span data-testid="configured">{String(configured)}</span>
      <button type="button" onClick={() => void signIn('github')}>signin</button>
      <button type="button" onClick={() => void completeSignIn('agent-store://auth-callback?code=abc123')}>complete</button>
    </div>
  )
}

function renderProbe() {
  spyOn(rpcModule, 'callRpc').mockImplementation((async (method: string) => {
    if (method === 'getEntitlements') return { plan: 'free', advancedUsageAnalytics: false, smartRouting: false, keyRotation: false }
    if (method === 'syncEntitlement') return { plan: 'pro', advancedUsageAnalytics: true, smartRouting: true, keyRotation: true }
    if (method === 'clearEntitlement') return { plan: 'free', advancedUsageAnalytics: false, smartRouting: false, keyRotation: false }
    throw new Error(`unexpected RPC in Auth test: ${method}`)
  }) as typeof rpcModule.callRpc)

  render(
    <EntitlementProvider>
      <AuthProvider><Probe /></AuthProvider>
    </EntitlementProvider>
  )
}

test('reports configured when a supabase client is available', async () => {
  renderProbe()
  expect(await screen.findByTestId('configured')).toHaveTextContent('true')
})

test('signIn requests an OAuth url for the provider and opens it in the browser', async () => {
  renderProbe()
  fireEvent.click(screen.getByText('signin'))
  await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1))
  expect(signInWithOAuth).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: 'github',
      options: expect.objectContaining({ redirectTo: 'agent-store://auth-callback', skipBrowserRedirect: true }),
    })
  )
  await waitFor(() => expect(openMock).toHaveBeenCalledWith('https://github.com/login/oauth?x=1'))
})

test('completeSignIn exchanges the callback code for a session', async () => {
  renderProbe()
  fireEvent.click(screen.getByText('complete'))
  await waitFor(() => expect(exchangeCodeForSession).toHaveBeenCalledWith('abc123'))
})
