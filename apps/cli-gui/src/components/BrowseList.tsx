import { useState, type FormEvent } from 'react'
import type { Item } from '@aas/types'
import { callRpc } from '../lib/rpc'
import { useTerminalLog } from '../state/TerminalLog'

export function BrowseList() {
  const { appendLine } = useTerminalLog()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const items = await callRpc<Item[]>('search', [query])
    setResults(items)
  }

  async function install(item: Item) {
    appendLine(`$ aas install ${item.slug}`)
    try {
      const result = await callRpc<{ version: string }>('install', [item.slug])
      appendLine(`✓ 已安装 ${item.slug} ${result.version}`, 'green')
    } catch (err) {
      appendLine(`✗ ${err instanceof Error ? err.message : String(err)}`, 'red')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form role="search" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="搜索资源…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-store-border bg-store-panel px-3 py-2 text-sm text-store-text"
        />
      </form>

      <div className="flex flex-col gap-2">
        {results.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-store-border bg-store-panel px-3 py-2"
          >
            <div>
              <p className="text-sm text-store-text">{item.name}</p>
              <p className="text-xs text-store-text-3">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => install(item)}
              className="rounded-md bg-store-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              安装
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
