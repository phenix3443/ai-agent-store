'use client'

import type { Item } from '@as/types'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Copy, Download, Heart, X } from 'lucide-react'
import { CATEGORY_META, CategoryGlyph, TIER_META, formatDownloads } from '@/lib/item-meta'
import { useClientState } from './ClientStateProvider'

interface DetailDrawerProps {
  item: Item
  open: boolean
  onOpenChange: (open: boolean) => void
}

function metaStat(item: Item): { value: string; label: string } {
  if (item.category === 'provider') return { value: String(item.supportedModels.length), label: '模型' }
  if (item.category === 'mcp') return { value: item.transport, label: '传输' }
  return { value: String(item.compatibleWith.length), label: '兼容' }
}

export function DetailDrawer({ item, open, onOpenChange }: DetailDrawerProps) {
  const { favorites, toggleFavorite, installed, toggleInstalled } = useClientState()
  const isFavorite = !!favorites[item.id]
  const isInstalled = !!installed[item.id]
  const cat = CATEGORY_META[item.category]
  const tier = TIER_META[item.publisher.tier]
  const meta = metaStat(item)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-store-border-strong bg-store-win p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-[26px]"
              style={{ background: cat.soft, color: cat.color }}
            >
              <CategoryGlyph category={item.category} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Dialog.Title className="truncate font-mono text-lg font-bold text-store-text">
                  {item.name}
                </Dialog.Title>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: tier.soft, color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-store-text-2">
                {item.publisher.name} · <span style={{ color: cat.color }}>{cat.label}</span>
              </p>
            </div>
            <button
              type="button"
              aria-label={isFavorite ? '取消收藏' : '收藏'}
              onClick={() => toggleFavorite(item.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-store-border hover:bg-store-panel"
            >
              <Heart size={16} className={isFavorite ? 'fill-store-red text-store-red' : 'text-store-text-3'} />
            </button>
            <Dialog.Close
              aria-label="关闭"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-store-border text-store-text-3 hover:bg-store-panel"
            >
              <X size={15} />
            </Dialog.Close>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-store-border bg-store-term-bg px-3.5 py-3">
            <span className="font-mono text-[13px] text-store-green">$</span>
            <span className="flex-1 truncate font-mono text-[13px] text-[#e6e6ea]">as install {item.slug}</span>
            <Copy size={15} className="shrink-0 text-store-text-2" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg border border-store-border bg-store-panel px-2.5 py-3">
              <div className="font-mono text-[15px] font-bold text-store-text">{formatDownloads(item.downloads)}</div>
              <div className="mt-0.5 text-[10px] text-store-text-3">下载</div>
            </div>
            <div className="rounded-lg border border-store-border bg-store-panel px-2.5 py-3">
              <div className="font-mono text-[15px] font-bold text-store-star">★ {item.rating.toFixed(1)}</div>
              <div className="mt-0.5 text-[10px] text-store-text-3">评分</div>
            </div>
            <div className="rounded-lg border border-store-border bg-store-panel px-2.5 py-3">
              <div className="font-mono text-[15px] font-bold text-store-text">v{item.version}</div>
              <div className="mt-0.5 text-[10px] text-store-text-3">版本</div>
            </div>
            <div className="rounded-lg border border-store-border bg-store-panel px-2.5 py-3">
              <div className="truncate font-mono text-[15px] font-bold text-store-text">{meta.value}</div>
              <div className="mt-0.5 text-[10px] text-store-text-3">{meta.label}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleInstalled(item.id)}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${
              isInstalled
                ? 'border border-store-green bg-store-green-soft text-store-green'
                : 'bg-store-accent text-white hover:brightness-110'
            }`}
          >
            {isInstalled ? (
              <>
                <Check size={16} />
                已安装到 CLI 客户端
              </>
            ) : (
              <>
                <Download size={16} />
                安装到 CLI 客户端
              </>
            )}
          </button>

          <div>
            <p className="mb-2 text-sm font-bold text-store-text">概述</p>
            <Dialog.Description className="text-sm leading-relaxed text-store-text-2">
              {item.description}
            </Dialog.Description>
          </div>

          {item.category === 'provider' && (
            <div className="text-sm">
              <p className="mb-1 font-medium text-store-text">支持的模型</p>
              <p className="text-store-text-2">{item.supportedModels.join(' · ')}</p>
            </div>
          )}

          {item.category === 'mcp' && (
            <div className="text-sm">
              <p className="mb-1 font-medium text-store-text">传输方式</p>
              <p className="text-store-text-2">
                {item.transport}
                {item.transport === 'stdio' ? ` · ${item.serverCommand}` : ` · ${item.url}`}
              </p>
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-store-code-bg px-2.5 py-1 font-mono text-xs text-store-text-2"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
