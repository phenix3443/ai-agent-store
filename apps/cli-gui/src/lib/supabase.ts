import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Desktop OAuth uses the PKCE flow: the browser completes sign-in and redirects
// back to the app's custom scheme (agent-store://auth-callback), which the Tauri
// deep-link handler exchanges for a session.
let client: SupabaseClient | null = null

/** Lazily creates the browser Supabase client from Vite env, or null if unconfigured. */
export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client
  // Guard against environments without Vite's import.meta.env (e.g. bun test).
  const env = (import.meta as { env?: Record<string, string | undefined> }).env
  const url = env?.['VITE_SUPABASE_URL']
  const anonKey = env?.['VITE_SUPABASE_ANON_KEY']
  if (!url || !anonKey) return null
  client = createClient(url, anonKey, {
    auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: false },
  })
  return client
}

/** The custom-scheme URL OAuth redirects back to; registered as a Supabase redirect URL and a Tauri deep link. */
export const AUTH_REDIRECT_URL = 'agent-store://auth-callback'
