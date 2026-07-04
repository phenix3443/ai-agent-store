import { useEffect, useState } from 'react'
import type { InstalledItem } from '@aas/types'
import { callRpc } from '../lib/rpc'
import { useAppState } from '../state/AppState'

const CATEGORY_CARDS: { category: InstalledItem['category']; label: string }[] = [
  { category: 'provider', label: '供应商' },
  { category: 'skill', label: '技能' },
  { category: 'mcp', label: 'MCP' },
]

export function Overview() {
  const { setNavView, setCategoryFilter } = useAppState()
  const [installed, setInstalled] = useState<InstalledItem[]>([])

  useEffect(() => {
    callRpc<InstalledItem[]>('list').then(setInstalled)
  }, [])

  function goToCategory(category: InstalledItem['category']) {
    setCategoryFilter(category)
    setNavView('browse')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold text-store-text">概览</h1>

      <div className="grid grid-cols-3 gap-4">
        {CATEGORY_CARDS.map(({ category, label }) => (
          <button
            key={category}
            type="button"
            onClick={() => goToCategory(category)}
            className="flex flex-col items-start gap-1 rounded-xl border border-store-border bg-store-panel p-4 text-left hover:border-store-border-strong"
          >
            <span className="text-xs font-medium text-store-text-2">{label}</span>
            <span className="text-2xl font-semibold text-store-text">
              {installed.filter((i) => i.category === category).length}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
