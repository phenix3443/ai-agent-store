import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Entitlements } from '@as/types'
import { openExternal } from '../lib/openExternal'
import { onDeepLink } from '../lib/deepLink'
import { getSupabaseClient, AUTH_REDIRECT_URL } from '../lib/supabase'
import { callRpc } from '../lib/rpc'
import { useEntitlement } from './Entitlement'

export type AuthProviderName = 'github' | 'google'

interface AuthValue {
  email: string | null
  signedIn: boolean
  /** Current session access token, for authenticating store API calls (e.g. checkout binding). */
  accessToken: string | null
  /** False when Supabase env is missing — sign-in is unavailable. */
  configured: boolean
  signIn: (provider: AuthProviderName) => Promise<void>
  /** Called by the deep-link handler with the agent-store://auth-callback URL. */
  completeSignIn: (callbackUrl: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient()
  const { refresh: refreshEntitlements } = useEntitlement()
  const [session, setSession] = useState<Session | null>(null)

  // On session change, sync (or clear) the locally cached plan, then refresh the
  // entitlement UI. Failures leave the last-known cached plan untouched.
  async function applySession(next: Session | null) {
    setSession(next)
    try {
      if (next) await callRpc<Entitlements>('syncEntitlement', [next.access_token])
      else await callRpc<Entitlements>('clearEntitlement')
    } catch {
      // keep cached plan
    }
    refreshEntitlements()
  }

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void applySession(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void applySession(next)
    })
    // The OAuth browser flow redirects to agent-store://auth-callback; complete it here.
    let unlistenDeepLink = () => {}
    void onDeepLink((url) => void completeSignIn(url)).then((u) => {
      if (active) unlistenDeepLink = u
      else u()
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
      unlistenDeepLink()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signIn(provider: AuthProviderName) {
    if (!supabase) throw new Error('登录未配置：缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      // Complete sign-in via the system browser, then deep-link back to the app.
      options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
    })
    if (error) throw error
    if (data.url) await openExternal(data.url)
  }

  async function completeSignIn(callbackUrl: string) {
    if (!supabase) return
    const code = new URL(callbackUrl).searchParams.get('code')
    if (!code) return
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    await applySession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        email: session?.user?.email ?? null,
        signedIn: session != null,
        accessToken: session?.access_token ?? null,
        configured: supabase != null,
        signIn,
        completeSignIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
