import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Entitlements } from '@as/types'
import { callRpc } from '../lib/rpc'

/** Feature keys gated by plan — the boolean fields of Entitlements. */
export type ProFeature = 'advancedUsageAnalytics' | 'smartRouting' | 'keyRotation'

const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  advancedUsageAnalytics: false,
  smartRouting: false,
  keyRotation: false,
}

interface EntitlementValue {
  entitlements: Entitlements
  /** Whether the current plan unlocks a given Pro feature. */
  has: (feature: ProFeature) => boolean
  /** Re-fetches entitlements (e.g. after sign-in or upgrade). */
  refresh: () => void
}

const EntitlementContext = createContext<EntitlementValue | null>(null)

export function EntitlementProvider({ children }: { children: ReactNode }) {
  // Default to free until the fetch resolves, so a gated feature never flashes unlocked.
  const [entitlements, setEntitlements] = useState<Entitlements>(FREE_ENTITLEMENTS)

  function refresh() {
    callRpc<Entitlements>('getEntitlements')
      .then(setEntitlements)
      .catch(() => setEntitlements(FREE_ENTITLEMENTS))
  }

  useEffect(refresh, [])

  return (
    <EntitlementContext.Provider
      value={{ entitlements, has: (feature) => entitlements[feature], refresh }}
    >
      {children}
    </EntitlementContext.Provider>
  )
}

export function useEntitlement(): EntitlementValue {
  const ctx = useContext(EntitlementContext)
  if (!ctx) throw new Error('useEntitlement must be used within EntitlementProvider')
  return ctx
}
