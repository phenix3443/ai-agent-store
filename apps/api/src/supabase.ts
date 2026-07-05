import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Env bag: Cloudflare Workers passes secrets via the fetch handler's `env`
 * (surfaced as Hono `c.env`); local Bun has no such bag and falls back to
 * process.env. Accept either. */
export type SupabaseEnv = {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
}

/**
 * Create a plain (cookie-less) Supabase client. `env` wins (Workers); otherwise
 * fall back to process.env (local Bun). Supports the NEXT_PUBLIC_* names so the
 * same .env used by the web app works locally.
 */
export function getSupabase(env?: SupabaseEnv): SupabaseClient {
  const pick = (k: keyof SupabaseEnv) => env?.[k] ?? (typeof process !== 'undefined' ? process.env?.[k] : undefined)
  const url = pick('SUPABASE_URL') ?? pick('NEXT_PUBLIC_SUPABASE_URL')
  const key = pick('SUPABASE_ANON_KEY') ?? pick('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) {
    throw new Error(
      'Missing Supabase config: set SUPABASE_URL and SUPABASE_ANON_KEY (or the NEXT_PUBLIC_* equivalents).'
    )
  }
  return createClient(url, key)
}
