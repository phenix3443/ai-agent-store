import { useEffect, useState } from 'react'
import type { LocalRelayConfig, RelayStatus } from '@aas/types'
import { callRpc } from '../lib/rpc'
import { ProxyLogModal } from './ProxyLogModal'

export function LocalRelayDetail() {
  const [configs, setConfigs] = useState<LocalRelayConfig[]>([])
  const [status, setStatus] = useState<RelayStatus>({ running: false })
  const [logModalOpen, setLogModalOpen] = useState(false)

  async function refresh() {
    setConfigs(await callRpc<LocalRelayConfig[]>('listLocalConfigs'))
    setStatus(await callRpc<RelayStatus>('getRelayStatus'))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addConfig() {
    await callRpc('addLocalConfig', ['新配置'])
    refresh()
  }

  async function renameConfig(id: string, name: string) {
    await callRpc('updateLocalConfig', [id, { name }])
    refresh()
  }

  async function changePort(id: string, port: number) {
    if (!Number.isInteger(port) || port <= 0) return
    await callRpc('updateLocalConfig', [id, { port }])
    refresh()
  }

  async function toggle(id: string) {
    await callRpc('toggleLocalConfig', [id])
    refresh()
  }

  async function remove(id: string) {
    await callRpc('removeLocalConfig', [id])
    refresh()
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-store-text">本地代理</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLogModalOpen(true)}
            className="rounded-md border border-store-border-strong px-3 py-1.5 text-xs font-medium text-store-text"
          >
            查看代理日志
          </button>
          <button
            type="button"
            onClick={addConfig}
            className="rounded-md bg-store-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            新增配置
          </button>
        </div>
      </div>

      <p className="text-xs text-store-text-2">
        {status.running ? `运行中（pid ${status.pid}）` : '未运行'}
      </p>

      <div className="flex flex-col gap-2">
        {configs.map((config) => (
          <div key={config.id} className="flex items-center gap-3 rounded-lg border border-store-border bg-store-panel px-3 py-2">
            <input
              value={config.name}
              onChange={(e) => renameConfig(config.id, e.target.value)}
              className="w-32 rounded-md border border-store-border bg-store-panel-2 px-2 py-1 text-sm text-store-text"
            />
            <input
              type="number"
              value={config.port}
              onChange={(e) => changePort(config.id, Number(e.target.value))}
              className="w-24 rounded-md border border-store-border bg-store-panel-2 px-2 py-1 text-sm text-store-text"
            />
            <button
              type="button"
              aria-label={`${config.name} 启用状态`}
              aria-pressed={config.enabled}
              onClick={() => toggle(config.id)}
              className={`rounded-md px-2 py-1 text-xs ${
                config.enabled ? 'bg-store-green/10 text-store-green' : 'bg-store-panel-2 text-store-text-2'
              }`}
            >
              {config.enabled ? '已启用' : '已禁用'}
            </button>
            <button
              type="button"
              onClick={() => remove(config.id)}
              className="ml-auto text-xs text-store-red hover:opacity-80"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <ProxyLogModal open={logModalOpen} onOpenChange={setLogModalOpen} />
    </div>
  )
}
