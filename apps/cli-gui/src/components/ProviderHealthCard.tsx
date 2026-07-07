import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { ProviderHealth } from '@as/types'
import { callRpc } from '../lib/rpc'

const ERROR_LABELS: Record<string, string> = {
  auth: '认证失败',
  rate_limit: '被限流',
  overload: '过载',
  server: '服务端错误',
  network: '网络错误',
}

function remaining(cooldownUntil: number | null): string {
  if (!cooldownUntil) return ''
  const secs = Math.max(0, Math.round((cooldownUntil - Date.now()) / 1000))
  return secs >= 60 ? `${Math.round(secs / 60)} 分钟` : `${secs} 秒`
}

export function ProviderHealthCard() {
  const [health, setHealth] = useState<ProviderHealth[]>([])

  const refresh = useCallback(() => {
    callRpc<ProviderHealth[]>('getProviderHealth')
      .then((h) => setHealth(h ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [refresh])

  async function reset(slug: string) {
    await callRpc('resetProviderHealth', [slug])
    refresh()
  }

  if (health.length === 0) return null

  const coolingCount = health.filter((h) => h.status === 'cooling').length

  return (
    <div className="rounded-xl border border-store-border bg-store-panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck size={15} className="text-store-text-2" />
        <p className="text-sm font-medium text-store-text">供应商健康</p>
        {coolingCount > 0 && (
          <span className="rounded-full bg-store-amber-soft px-1.5 py-0.5 text-[10px] font-medium text-store-amber">
            {coolingCount} 冷却中
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {health.map((h) => (
          <div key={h.providerSlug} className="flex items-center justify-between text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${h.status === 'up' ? 'bg-store-green' : 'bg-store-amber'}`} />
              <span className="font-mono font-medium text-store-text">{h.providerSlug}</span>
              {h.status === 'cooling' && (
                <span className="truncate text-store-text-3">
                  {ERROR_LABELS[h.lastErrorKind ?? ''] ?? h.lastErrorKind}
                  {h.lastStatus ? `（${h.lastStatus}）` : ''} · 冷却 {remaining(h.cooldownUntil)}
                </span>
              )}
            </div>
            {h.status === 'cooling' ? (
              <button type="button" onClick={() => reset(h.providerSlug)} className="shrink-0 text-store-accent hover:underline">
                立即恢复
              </button>
            ) : (
              <span className="shrink-0 text-store-green">正常</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
