import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tab = 'account' | 'language'

const LANGUAGES = [
  { code: 'zh', label: '中文', enabled: true },
  { code: 'en', label: 'English', enabled: true },
  { code: 'ja', label: '日本語（即将支持）', enabled: false },
  { code: 'ko', label: '한국어（即将支持）', enabled: false },
  { code: 'es', label: 'Español（即将支持）', enabled: false },
]

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('account')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-store-border bg-store-content p-6">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-store-text">设置</Dialog.Title>
            <Dialog.Close aria-label="关闭" className="text-store-text-2 hover:text-store-text">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab('account')}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'account' ? 'bg-store-panel-2 text-store-text' : 'text-store-text-2'}`}
            >
              账户
            </button>
            <button
              type="button"
              onClick={() => setTab('language')}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'language' ? 'bg-store-panel-2 text-store-text' : 'text-store-text-2'}`}
            >
              语言
            </button>
          </div>

          {tab === 'account' && <p className="text-sm text-store-text-2">未登录</p>}

          {tab === 'language' && (
            <div className="flex flex-col gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  disabled={!lang.enabled}
                  className="rounded-lg px-3 py-2 text-left text-sm text-store-text disabled:cursor-not-allowed disabled:text-store-text-3"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
