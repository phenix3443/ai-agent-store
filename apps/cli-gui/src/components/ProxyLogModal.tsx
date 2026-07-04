import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import type { RecentRequestRow } from '@aas/types'
import { X } from 'lucide-react'
import { callRpc } from '../lib/rpc'

interface ProxyLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProxyLogModal({ open, onOpenChange }: ProxyLogModalProps) {
  const [rows, setRows] = useState<RecentRequestRow[]>([])

  useEffect(() => {
    if (!open) return
    callRpc<RecentRequestRow[]>('getRecentRequests', [{ limit: 20 }]).then(setRows)
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-store-border bg-store-content p-6">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-store-text">代理请求日志</Dialog.Title>
            <Dialog.Close aria-label="关闭" className="text-store-text-2 hover:text-store-text">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-1">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-store-border bg-store-panel px-3 py-2 text-xs">
                <span className="text-store-text-3">{row.createdAt}</span>
                <span className="text-store-text">{row.target}</span>
                <span className="font-mono text-store-text-2">{row.model}</span>
                <span className="text-store-text">
                  {row.providerSlug}
                  {row.isFallback ? '（降级）' : ''}
                </span>
                <span className={row.statusCode >= 400 ? 'text-store-red' : 'text-store-green'}>{row.statusCode}</span>
                <span className="text-store-text-3">{row.latencyMs}ms</span>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
